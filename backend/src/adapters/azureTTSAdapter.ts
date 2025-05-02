import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { azureTTSConfig } from '../config/azureTTSConfig'

export class AzureTTSAdapter {
  async synthesizeSpeech(text: string, uuid: string, language: string): Promise<string> {
    const voice = azureTTSConfig.voices[language] || azureTTSConfig.voices.English
    console.log(`[AzureTTS] Requested language: ${language}, Using voice: ${voice}`)
    const url = `https://${azureTTSConfig.region}.tts.speech.microsoft.com/cognitiveservices/v1`
    const headers = {
      'Ocp-Apim-Subscription-Key': azureTTSConfig.key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'quick-cards-app'
    }
    // Remove all <br>, <br/>, and <br /> tags (case-insensitive)
    const safeText = text.replace(/<br\s*\/?>/gi, ' ')
    
    // Map language names to Azure TTS language codes
    const languageCodeMap: Record<string, string> = {
      'Arabic': 'ar-SA',
      'Mandarin Chinese': 'zh-CN',
      'Japanese': 'ja-JP',
      'Portuguese (Brazil)': 'pt-BR',
      'Portuguese': 'pt-BR',
      'Spanish': 'es-MX',
      'English': 'en-US'
    }
    
    const languageCode = languageCodeMap[language] || 'en-US'
    
    const ssml = `
      <speak version='1.0' xml:lang='${languageCode}'>
        <voice xml:lang='${languageCode}' name='${voice}'>
          ${safeText}
        </voice>
      </speak>
    `
    const response = await axios.post(url, ssml, { headers, responseType: 'arraybuffer' })
    const audioDir = path.resolve(__dirname, '../../audio')
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir)
    const filePath = path.join(audioDir, `${uuid}.mp3`)
    fs.writeFileSync(filePath, response.data)
    return filePath
  }
} 