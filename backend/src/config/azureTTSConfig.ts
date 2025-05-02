export const azureTTSConfig = {
  key: process.env.AZURE_TTS_KEY || '',
  region: process.env.AZURE_TTS_REGION || '',
  voices: {
    'Arabic': 'ar-SA-HamedNeural',
    'Mandarin Chinese': 'zh-CN-XiaoxiaoNeural',
    'Japanese': 'ja-JP-NanamiNeural',
    'Portuguese (Brazil)': 'pt-BR-ManuelaNeural',
    Portuguese: 'pt-BR-FranciscaNeural',
    Spanish: 'es-MX-DaliaNeural',
    English: 'en-US-JennyNeural',
    // Add more as needed
  } as Record<string, string>
} 