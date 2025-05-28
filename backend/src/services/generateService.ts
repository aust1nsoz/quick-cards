import { GenerateCardsRequest } from '../models/generateRequest'
import { OpenAIAdapter } from '../adapters/openaiAdapter'
import { parseCardsFromGptResponse, Card } from './parseCardsService'
import { AzureTTSAdapter } from '../adapters/azureTTSAdapter'
import { createAnkiApkg } from './ankiExportService'
import fs from 'fs'

// Rate limiter class to handle TTS API calls
class RateLimiter {
  private queue: (() => Promise<void>)[] = []
  private processing = false
  private readonly requestsPerSecond: number
  private readonly interval: number
  private readonly maxRetries: number
  private readonly initialBackoffMs: number

  constructor(requestsPerSecond: number, maxRetries = 3, initialBackoffMs = 1000) {
    this.requestsPerSecond = requestsPerSecond
    this.interval = 1000 / requestsPerSecond
    this.maxRetries = maxRetries
    this.initialBackoffMs = initialBackoffMs
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithRetry(fn)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, retryCount = 0): Promise<T> {
    try {
      return await fn()
    } catch (error: any) {
      // Check if it's a 429 error
      if (error?.response?.status === 429 && retryCount < this.maxRetries) {
        const backoffTime = this.initialBackoffMs * Math.pow(2, retryCount)
        console.log(`Rate limit hit, retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${this.maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, backoffTime))
        return this.executeWithRetry(fn, retryCount + 1)
      }
      throw error
    }
  }

  private async process() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const fn = this.queue.shift()
      if (fn) {
        await fn()
        await new Promise(resolve => setTimeout(resolve, this.interval))
      }
    }

    this.processing = false
  }
}

export interface GenerateCardsResponse {
  message: string
  cards: (Card & { audioPath: string })[]
  apkgFiles: {
    name: string
    content: string
  }[]
}

export class GenerateCardsService {
  private openAIAdapter: OpenAIAdapter
  private azureTTSAdapter: AzureTTSAdapter
  private ttsRateLimiter: RateLimiter

  constructor() {
    this.openAIAdapter = new OpenAIAdapter()
    this.azureTTSAdapter = new AzureTTSAdapter()
    this.ttsRateLimiter = new RateLimiter(100, 10, 2000) // 3 requests per second, max 10 retries, 2s initial backoff
  }

  private async generateCardsWithGPT(words: string[], sourceLanguage: string, targetLanguage: string): Promise<Card[]> {
    const maxRetries = 3
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const fullPrompt = `You are a language tutor generating flashcards for language learners in a format ready for Anki import.

Language Configuration:
- Source Language: ${sourceLanguage}
- Target Language: ${targetLanguage}

Instructions:

1. For each term or phrase in the list below:
   - Translate it into the target language, preserving its grammatical form (infinitive, conjugated, etc.).  
   - If ambiguous, default to the infinitive form.
   - Use the most common meaning, unless context implies otherwise.
2. Create an example sentence in the source language that uses the term naturally and in context.
3. Translate the sentence into the target language.
4. If the input word or phrase has a spelling mistake, fix it.

Formatting Rules (for Anki import):

- Each flashcard must be on a single line.
- The front field should contain:
  - The translation of the term or phrase, also ending with a period.
  - Followed by <br><br>
  - Then the translated sentence.
- The back field should contain:
  - The source term or phrase in the source language, ending with a period.
  - Followed by <br><br>
  - Then the example sentence in the source language.
- Separate the front and back fields with a single semicolon ;
- No extra line breaks, no additional explanations, no markdown, and no bullet points.

Example Input:
sneezing 
ganhar - I got a prize 
parecer - to seem 
pexie
I run fast

Example Output:
Espirrar.<br><br>Ela começou a espirrar por causa do pólen.;Sneezing.<br><br>She started sneezing because of the pollen.
Ganhar.<br><br>Eu ganhei um prêmio na escola.;I got a prize.<br><br>I got a prize at school.
Parecer.<br><br>Ele parece cansado hoje.;To seem.<br><br>He seems tired today.
Peixe.<br><br>O peixe está nadando no aquário.;Fish.<br><br>The fish is swimming in the aquarium.
Eu corro rápido.<br><br>Eu corro rápido todos os dias.;I run fast.<br><br>I run fast every day.

Word List:
${words.join('\n')}

Return only the list of flashcards, following the exact format described above.`

        const response = await this.openAIAdapter.generateCompletion({
          prompt: fullPrompt,
          temperature: 0.7,
          maxTokens: 2048
        })

        console.log('Raw GPT Response:', response)
        return parseCardsFromGptResponse(response)
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error)
        lastError = error
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          console.log(`Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  private async generateAudioForCards(cards: Card[], targetLanguage: string): Promise<(Card & { audioPath: string })[]> {
    try {
      return await Promise.all(
        cards.map(async (card) => {
          const audioPath = await this.ttsRateLimiter.add(() => 
            this.azureTTSAdapter.synthesizeSpeech(
              card.front,
              card.uuid,
              targetLanguage
            )
          )
          return { ...card, audioPath }
        })
      )
    } catch (error: any) {
      // If the error is a rate limit or too many retries, throw a recognizable error
      if (error?.response?.status === 429 || error?.message?.includes('Rate limit')) {
        throw new Error('AZURE_TTS_RATE_LIMIT')
      }
      throw error
    }
  }

  private async createApkgFiles(cardsWithAudio: (Card & { audioPath: string })[], deckName: string, includeReversedCards: boolean): Promise<{ name: string, content: string }[]> {
    const apkgPaths = await createAnkiApkg(
      cardsWithAudio, 
      deckName,
      includeReversedCards
    )

    return Promise.all(
      apkgPaths.map(async (path) => {
        const content = fs.readFileSync(path)
        fs.unlinkSync(path)
        return {
          name: path.split('/').pop() || 'deck.apkg',
          content: content.toString('base64')
        }
      })
    )
  }

  async generateAnkiCards(request: GenerateCardsRequest): Promise<GenerateCardsResponse> {
    console.log('Processing cards generation request:', {
      deckName: request.deckName,
      words: request.words,
      targetLanguage: request.targetLanguage,
      sourceLanguage: request.sourceLanguage
    })

    const words = request.words.split('\n').map(word => word.trim()).filter(word => word.length > 0)
    const cards = await this.generateCardsWithGPT(words, request.sourceLanguage, request.targetLanguage)
    const cardsWithAudio = await this.generateAudioForCards(cards, request.targetLanguage)
    const apkgFiles = await this.createApkgFiles(
      cardsWithAudio, 
      request.deckName,
      request.includeReversedCards || false
    )

    return {
      message: `Successfully generated ${cardsWithAudio.length} flashcards and Anki decks`,
      cards: cardsWithAudio,
      apkgFiles
    }
  }

  // Example method for calling an external API
  private async callExternalAPI(request: GenerateCardsRequest): Promise<void> {
    // This is where you would implement the external API call
    console.log('Calling external API with request:', request)
    // Example: await axios.post('https://api.example.com', request)
  }

  async previewCard(request: { input: string, targetLanguage: string, sourceLanguage: string }) {
    try {
      const firstLine = request.input.split('\n')[0].trim()
      const cards = await this.generateCardsWithGPT([firstLine], request.sourceLanguage, request.targetLanguage)
      return {
        card: cards[0]
      }
    } catch (error) {
      console.error('Error generating preview card:', error)
      throw error
    }
  }

  async reviewUserInputsProvideFeedback(request: { input: string, targetLanguage: string, sourceLanguage: string }) {
    try {
      const lines = request.input.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      
      const prompt = `You are validating user input for a flashcard generator app. The user submits a list of prompts, one per line. Each line should follow one of the supported input formats listed below. Your job is to help the user correct any lines that don't follow these formats, so they can get the best possible results. Users need to match a format. It doesn't need to be clear which format. Be encouraging and helpful.

Supported Prompt Templates (examples included):

1. a single word in source or target. 
   Example: 
- fish
- oi

2. word in target - used in sentence (target)  
   Example: ficar - ficar vermelha

3. word in source - used in sentence (source)
    Example: cat - the cat is not very big

4. short phrase in target  or source
   Examples: 
- não liga
- Go away
- fresh fish 
- bem te vi

5. conjugated verb in (source)  
   Example: i run

6. conjugated verb (target)  
   Example: corro

Unsupported Template:

- word in target - used in sentence (source)  
    Example: ficar - to become red

Instructions:

You will receive a list of user-submitted lines. For each line:

- Only give feedback on problematic lines (those that do not match any valid template).
- For each problematic line:
  - Gently explain that the format may not generate a flashcard correctly.
  - Suggest a revised version using one of the supported templates.
  - Prefer suggestions that include more context, not less.
  - Only give **one** clear suggestion per line.

If all lines are valid:
- Respond only with this exact phrase:
'All lines are valid.'
- Do not include any extra text, commentary, emojis, markdown formatting, or encouragement.
- Your entire response must be exactly: 'All lines are valid.' (no quotes).

If you say anything else when all lines are valid, it will be considered a mistake.

User Input:
${request.input}.`
      
      const response = await this.openAIAdapter.generateCompletion({
        prompt,
        temperature: 0.7,
        maxTokens: 2048
      })

      return {
        feedback: response
      }
    } catch (error) {
      console.error('Error reviewing user inputs:', error)
      throw error
    }
  }
} 