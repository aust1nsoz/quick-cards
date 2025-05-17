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
    this.ttsRateLimiter = new RateLimiter(5, 3, 2000) // 5 requests per second, max 3 retries, 2s initial backoff
  }

  async generateAnkiCards(request: GenerateCardsRequest): Promise<GenerateCardsResponse> {
    // Log the request data
    console.log('Processing cards generation request:', {
      deckName: request.deckName,
      words: request.words,
      targetLanguage: request.targetLanguage,
      sourceLanguage: request.sourceLanguage
    })

    // Split the input words into an array and clean them
    const words = request.words.split('\n').map(word => word.trim()).filter(word => word.length > 0)

    // Create the prompt with all instructions
    const fullPrompt = `You are a language tutor generating flashcards for language learners in a format ready for Anki import.

Language Configuration:
- Source Language: ${request.sourceLanguage}
- Target Language: ${request.targetLanguage}

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

Example Output:
Espirrar.<br><br>Ela começou a espirrar por causa do pólen.;Sneezing.<br><br>She started sneezing because of the pollen.
Ganhar.<br><br>Eu ganhei um prêmio na escola.;I got a prize.<br><br>I got a prize at school.
Parecer.<br><br>Ele parece cansado hoje.;To seem.<br><br>He seems tired today.
Peixe.<br><br>O peixe está nadando no aquário.;Fish.<br><br>The fish is swimming in the aquarium.

Word List:
${words.join('\n')}

Return only the list of flashcards, following the exact format described above.`

    // Get translations and example sentences in one API call
    const response = await this.openAIAdapter.generateCompletion({
      prompt: fullPrompt,
      temperature: 0.7,
      maxTokens: 2048 // Adjust based on your needs
    })

    // Log the raw GPT response
    console.log('Raw GPT Response:', response)

    // Use the new parser to get cards in the desired format
    const cards = parseCardsFromGptResponse(response)

    // Generate audio for each card's front using Azure TTS with rate limiting
    const cardsWithAudio = await Promise.all(
      cards.map(async (card) => {
        const audioPath = await this.ttsRateLimiter.add(() => 
          this.azureTTSAdapter.synthesizeSpeech(
            card.front,
            card.uuid,
            request.targetLanguage
          )
        )
        return { ...card, audioPath }
      })
    )

    // Create the Anki .apkg files
    const apkgPaths = await createAnkiApkg(
      cardsWithAudio, 
      request.deckName,
      request.includeReversedCards || false
    )

    // Read the APKG files and convert to base64
    const apkgFiles = await Promise.all(
      apkgPaths.map(async (path) => {
        const content = fs.readFileSync(path)
        // Clean up the APKG file after reading it
        fs.unlinkSync(path)
        return {
          name: path.split('/').pop() || 'deck.apkg',
          content: content.toString('base64')
        }
      })
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
} 