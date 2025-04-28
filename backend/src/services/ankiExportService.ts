import { Card } from './parseCardsService'
import AnkiExport from 'anki-apkg-export'
import fs from 'fs'
import path from 'path'

export async function createAnkiApkg(
  cards: (Card & { audioPath: string })[],
  deckName: string
): Promise<string> {
  const apkg = new AnkiExport(deckName)

  for (const card of cards) {
    // Attach audio using Anki's [sound:filename.mp3] syntax in the back field
    const audioFileName = path.basename(card.audioPath)
    const backWithAudio = `${card.back}<br>[sound:${audioFileName}]`
    apkg.addMedia(audioFileName, fs.readFileSync(card.audioPath))
    apkg.addCard(card.front, backWithAudio)
  }

  const outputDir = path.resolve(__dirname, '../../decks')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)
  const filePath = path.join(outputDir, `${deckName.replace(/\s+/g, '_')}.apkg`)
  const zip = await apkg.save()
  fs.writeFileSync(filePath, Buffer.from(zip))
  return filePath
} 