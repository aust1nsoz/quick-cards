import OpenAI from 'openai'
import { APIError } from 'openai/error'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { config } from '../config'

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
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: 60000, // Increase timeout to 60 seconds
      maxRetries: 3
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

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4.1-mini',
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