import fastify from 'fastify'
import cors from '@fastify/cors'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Create Fastify instance
const server = fastify({
  logger: true
})

// Register CORS
server.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Vue's default dev server port
  methods: ['GET', 'POST']
})

// Define the request body type
interface GenerateRequest {
  deckName: string
  words: string
  targetLanguage: string
  sourceLanguage: string
  isSpicyMode: boolean
}

// Register routes
server.post<{ Body: GenerateRequest }>('/generate', async (request, reply) => {
  const { deckName, words, targetLanguage, sourceLanguage, isSpicyMode } = request.body
  
  // Log the request data
  console.log('Received request:', {
    deckName,
    words,
    targetLanguage,
    sourceLanguage,
    isSpicyMode
  })

  // Return a simple response
  return { message: 'Hello from backend! Dogs and cats' }
})

// Start the server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
    await server.listen({ port, host: '0.0.0.0' })
    console.log(`Server is running on port ${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start() 