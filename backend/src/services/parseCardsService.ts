// Service to parse GPT response into card objects

import { v4 as uuidv4 } from 'uuid'

export interface Card {
  uuid: string; // Unique identifier
  front: string; // English (source language)
  back: string;  // Target language (e.g., Portuguese, Spanish)
}

/**
 * Parses the GPT response into an array of card objects.
 * @param gptResponse The raw string response from GPT
 * @returns Array of { uuid, front, back } objects
 */
export function parseCardsFromGptResponse(gptResponse: string): Card[] {
  return gptResponse
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.includes(';'))
    .map(line => {
      const [front, back] = line.split(';')
      return {
        uuid: uuidv4(),
        front: front.trim(),
        back: back.trim()
      }
    })
} 