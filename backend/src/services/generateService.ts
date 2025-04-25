import { GenerateCardsRequest } from '../models/generateRequest'
import { OpenAIAdapter } from '../adapters/openaiAdapter'

interface Translation {
  original: string
  translation: string
  sourceSentence: string
  targetSentence: string
}

interface GenerateCardsResponse {
  message: string
  translations: Translation[]
}

export class GenerateCardsService {
  private openAIAdapter: OpenAIAdapter

  constructor() {
    this.openAIAdapter = new OpenAIAdapter()
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

    console.log('Generated response:', response)

    // Parse the response into individual cards
    const cards = response.split('\n').filter(line => line.trim().length > 0)
    const translations: Translation[] = cards.map(card => {
      const [front, back] = card.split(';')
      const [original, sourceSentence] = front.split('<br><br>')
      const [translation, targetSentence] = back.split('<br><br>')
      
      return {
        original: original.trim(),
        translation: translation.trim(),
        sourceSentence: sourceSentence.trim(),
        targetSentence: targetSentence.trim()
      }
    })

    return {
      message: `Successfully generated ${translations.length} flashcards`,
      translations
    }
  }

  // Example method for calling an external API
  private async callExternalAPI(request: GenerateCardsRequest): Promise<void> {
    // This is where you would implement the external API call
    console.log('Calling external API with request:', request)
    // Example: await axios.post('https://api.example.com', request)
  }
} 