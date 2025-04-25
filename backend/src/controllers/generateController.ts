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
    } catch (error) {
      console.error('Error processing generate cards request:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  }
} 