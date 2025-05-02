export interface GenerateCardsRequest {
  deckName: string
  words: string
  targetLanguage: string
  sourceLanguage: string
  isSpicyMode?: boolean
  includeReversedCards?: boolean
} 