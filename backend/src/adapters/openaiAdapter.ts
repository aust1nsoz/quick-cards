import OpenAI from 'openai'
import { APIError } from 'openai/error'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

// Types for our adapter methods
export interface TranslationRequest {
  text: string
  sourceLanguage: string
  targetLanguage: string
}

export interface CompletionRequest {
  prompt: string
  maxTokens?: number
  temperature?: number
  systemMessage?: string
}

export class OpenAIError extends Error {
  constructor(
    message: string,
    public readonly code?: string | null,
    public readonly status?: number
  ) {
    super(message)
    this.name = 'OpenAIError'
  }
}

export class OpenAIAdapter {
  private client: OpenAI

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    this.client = new OpenAI({
      apiKey: apiKey,
      // Optional: configure timeouts, max retries, etc.
      timeout: 10000, // 10 seconds
      maxRetries: 3,
    })
  }

  /**
   * Generates Flash Cards using GPT-4
   */
  async generateCompletion({ prompt, maxTokens = 150, temperature = 0.7, systemMessage }: CompletionRequest): Promise<string> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: "You are a helpful language tutor."
        },
        {
          role: "user",
          content: prompt
        }
      ]

      const response = await this.client.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages,
        max_tokens: maxTokens,
        temperature: temperature,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new OpenAIError('No content in response from OpenAI')
      }

      return content.trim()
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Handles various types of OpenAI API errors
   */
  private handleError(error: unknown): never {
    if (error instanceof APIError) {
      // Handle specific OpenAI API errors
      throw new OpenAIError(
        error.message,
        error.code,
        error.status
      )
    } else if (error instanceof Error) {
      // Handle general errors
      throw new OpenAIError(error.message)
    } else {
      // Handle unknown errors
      throw new OpenAIError('An unknown error occurred')
    }
  }
} 