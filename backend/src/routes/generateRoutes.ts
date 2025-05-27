import { FastifyInstance } from 'fastify'
import { GenerateCardsController } from '../controllers/generateController'
import { GenerateCardsRequest } from '../models/generateRequest'

export async function generateCardsRoutes(fastify: FastifyInstance) {
  const generateCardsController = new GenerateCardsController()

  fastify.post<{ Body: GenerateCardsRequest }>('/generate-cards', (request, reply) => {
    return generateCardsController.handleGenerateCards(request, reply)
  })

  fastify.post('/preview-card', {
    handler: generateCardsController.handlePreviewCard.bind(generateCardsController)
  })

  fastify.post('/review-inputs', {
    handler: generateCardsController.handleReviewUserInputs.bind(generateCardsController)
  })
} 