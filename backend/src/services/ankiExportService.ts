import { Card } from './parseCardsService'
import AnkiExport from 'anki-apkg-export'
import fs from 'fs'
import path from 'path'

export async function createAnkiApkg(
  cards: (Card & { audioPath: string })[],
  deckName: string,
  includeReversedCards: boolean = true
): Promise<string[]> {
  const outputDir = path.resolve(__dirname, '../../decks')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

  const filePaths: string[] = []

  // Create Target -> Source deck
  const targetToSourceDeck = new AnkiExport(`${deckName} - Target to Source`)
  
  // Add media files and cards for Target -> Source
  for (const card of cards) {
    const audioFileName = path.basename(card.audioPath)
    targetToSourceDeck.addMedia(audioFileName, fs.readFileSync(card.audioPath))
    const backWithAudio = `${card.back}<br>[sound:${audioFileName}]`
    targetToSourceDeck.addCard(card.front, backWithAudio)
  }

  // Save Target -> Source deck
  const targetToSourcePath = path.join(outputDir, `${deckName.replace(/\s+/g, '_')}_Target.apkg`)
  const targetToSourceZip = await targetToSourceDeck.save()
  fs.writeFileSync(targetToSourcePath, Buffer.from(targetToSourceZip))
  filePaths.push(targetToSourcePath)

  // If reversed cards are enabled, create Source -> Target deck
  if (includeReversedCards) {
    const sourceToTargetDeck = new AnkiExport(`${deckName} - Source to Target`)
    
    // Add media files and cards for Source -> Target
    for (const card of cards) {
      const audioFileName = path.basename(card.audioPath)
      sourceToTargetDeck.addMedia(audioFileName, fs.readFileSync(card.audioPath))
      const backWithAudio = `${card.back}<br>[sound:${audioFileName}]`
      sourceToTargetDeck.addCard(backWithAudio, card.front)
    }

    // Save Source -> Target deck
    const sourceToTargetPath = path.join(outputDir, `${deckName.replace(/\s+/g, '_')}_Source.apkg`)
    const sourceToTargetZip = await sourceToTargetDeck.save()
    fs.writeFileSync(sourceToTargetPath, Buffer.from(sourceToTargetZip))
    filePaths.push(sourceToTargetPath)
  }

  // Clean up audio files
  for (const card of cards) {
    try {
      fs.unlinkSync(card.audioPath)
    } catch (error) {
      console.error(`Error deleting audio file ${card.audioPath}:`, error)
    }
  }

  return filePaths
} 