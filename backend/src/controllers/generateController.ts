import { FastifyRequest, FastifyReply } from 'fastify'
import { GenerateCardsRequest } from '../models/generateRequest'
import { GenerateCardsService } from '../services/generateService'

export class GenerateCardsController {
  private generateService: GenerateCardsService

  constructor() {
    this.generateService = new GenerateCardsService()
  }

  async handleGenerateCards(request: FastifyRequest<{ Body: GenerateCardsRequest }>, reply: FastifyReply) {
    try {
      const result = await this.generateService.generateAnkiCards(request.body)
      return reply.send(result)
    } catch (error: any) {
      console.error('Error processing generate cards request:', error)
      if (error?.message === 'AZURE_TTS_RATE_LIMIT') {
        return reply.status(429).send({ error: 'AZURE_TTS_RATE_LIMIT' })
      }
      return reply.status(500).send({ error: 'Internal server error' })
    }
  }

  async handlePreviewCard(request: FastifyRequest<{ Body: { input: string, targetLanguage: string, sourceLanguage: string } }>, reply: FastifyReply) {
    try {
      const result = await this.generateService.previewCard(request.body)
      return reply.send(result)
    } catch (error) {
      console.error('Error processing preview card request:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  }

  async handleReviewUserInputs(request: FastifyRequest<{ Body: { input: string, targetLanguage: string, sourceLanguage: string } }>, reply: FastifyReply) {
    try {
      const result = await this.generateService.reviewUserInputsProvideFeedback(request.body)
      return reply.send(result)
    } catch (error) {
      console.error('Error processing review request:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  }
} 