import { FastifyInstance } from 'fastify'
import { GenerateController } from '../controllers/generateController'
import { GenerateRequest } from '../models/generateRequest'

export async function generateRoutes(fastify: FastifyInstance) {
  const generateController = new GenerateController()

  fastify.post<{ Body: GenerateRequest }>('/generate', (request, reply) => {
    return generateController.handleGenerate(request, reply)
  })
} 