import { GenerateCardsRequest } from '../models/generateRequest'
import { OpenAIAdapter } from '../adapters/openaiAdapter'
import { parseCardsFromGptResponse, Card } from './parseCardsService'
import { AzureTTSAdapter } from '../adapters/azureTTSAdapter'
import { createAnkiApkg } from './ankiExportService'

export interface GenerateCardsResponse {
  message: string
  cards: (Card & { audioPath: string })[]
  apkgPath: string
}

export class GenerateCardsService {
  private openAIAdapter: OpenAIAdapter
  private azureTTSAdapter: AzureTTSAdapter

  constructor() {
    this.openAIAdapter = new OpenAIAdapter()
    this.azureTTSAdapter = new AzureTTSAdapter()
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
    const fullPrompt = `You are a language tutor creating flashcards for language learners.

Follow this setup:
- Source Language: ${request.sourceLanguage}
- Target Language: ${request.targetLanguage}

Instructions:
1. For each word provided, translate it into the target language, respecting the form given (infinitive, conjugated, etc.). If ambiguous, default to the infinitive form.
2. If the word has multiple meanings, use the most common meaning unless specific context is provided.
3. On the front of the card, show:
   - The word (in its original source language)
   - An example sentence in the source language using the word naturally
4. On the back of the card, show:
   - The translation of the word into the target language
   - The translation of the example sentence into the target language

Formatting Rules (for Anki import):
- Use <br><br> to separate the word from the sentence within each field.
- Use a single ; character to separate front and back fields.
- Each flashcard must be on a single line.
- No extra blank lines between cards.
- Do not add any explanations or notes outside of the card format.

Example Output Format:
Sneezing.<br><br>She was sneezing so much the dog thought it was a game.;Espirrando.<br><br>Ela estava espirrando tanto que o cachorro achou que era brincadeira.

Here are the words to process:
${words.join('\n')}

Return only the generated cards in this format.`

    // Get translations and example sentences in one API call
    const response = await this.openAIAdapter.generateCompletion({
      prompt: fullPrompt,
      temperature: 0.7,
      maxTokens: 2048 // Adjust based on your needs
    })

    // Use the new parser to get cards in the desired format
    const cards = parseCardsFromGptResponse(response)

    // Generate audio for each card's back using Azure TTS
    const cardsWithAudio = await Promise.all(
      cards.map(async (card) => {
        const audioPath = await this.azureTTSAdapter.synthesizeSpeech(
          card.back,
          card.uuid,
          request.targetLanguage
        )
        return { ...card, audioPath }
      })
    )

    // Create the Anki .apkg file
    const apkgPath = await createAnkiApkg(cardsWithAudio, request.deckName)

    return {
      message: `Successfully generated ${cardsWithAudio.length} flashcards and Anki deck`,
      cards: cardsWithAudio,
      apkgPath
    }
  }

  // Example method for calling an external API
  private async callExternalAPI(request: GenerateCardsRequest): Promise<void> {
    // This is where you would implement the external API call
    console.log('Calling external API with request:', request)
    // Example: await axios.post('https://api.example.com', request)
  }
} 