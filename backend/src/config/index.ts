export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    timeout: 60000, // 60 seconds
    maxRetries: 3
  }
} 