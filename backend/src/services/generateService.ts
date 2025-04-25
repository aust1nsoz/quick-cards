import { GenerateRequest } from '../models/generateRequest'

export class GenerateService {
  async processRequest(request: GenerateRequest): Promise<{ message: string }> {
    // Log the request data
    console.log('Processing request:', {
      deckName: request.deckName,
      words: request.words,
      targetLanguage: request.targetLanguage,
      sourceLanguage: request.sourceLanguage,
      isSpicyMode: request.isSpicyMode
    })

    // Here you would add your external API calls and business logic
    // For example:
    // await this.callExternalAPI(request)
    // await this.processWords(request.words)
    // etc.

    // For now, just return a simple response
    return { message: 'Hello from backend! Request processed successfully.' }
  }

  // Example method for calling an external API
  private async callExternalAPI(request: GenerateRequest): Promise<void> {
    // This is where you would implement the external API call
    console.log('Calling external API with request:', request)
    // Example: await axios.post('https://api.example.com', request)
  }
} 