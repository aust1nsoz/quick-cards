import { FastifyRequest, FastifyReply } from 'fastify'
import { GenerateRequest } from '../models/generateRequest'
import { GenerateService } from '../services/generateService'

export class GenerateController {
  private generateService: GenerateService

  constructor() {
    this.generateService = new GenerateService()
  }

  async handleGenerate(request: FastifyRequest<{ Body: GenerateRequest }>, reply: FastifyReply) {
    try {
      const result = await this.generateService.processRequest(request.body)
      return reply.send(result)
    } catch (error) {
      console.error('Error processing generate request:', error)
      return reply.status(500).send({ error: 'Internal server error' })
    }
  }
} 