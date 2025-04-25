import { FastifyInstance } from 'fastify'
import { GenerateCardsController } from '../controllers/generateController'
import { GenerateCardsRequest } from '../models/generateRequest'

export async function generateCardsRoutes(fastify: FastifyInstance) {
  const generateCardsController = new GenerateCardsController()

  fastify.post<{ Body: GenerateCardsRequest }>('/generate-cards', (request, reply) => {
    return generateCardsController.handleGenerateCards(request, reply)
  })
} 