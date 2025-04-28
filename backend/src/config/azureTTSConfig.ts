export const azureTTSConfig = {
  key: process.env.AZURE_TTS_KEY || '',
  region: process.env.AZURE_TTS_REGION || '',
  voices: {
    'Portuguese (Brazil)': 'pt-BR-FranciscaNeural',
    Portuguese: 'pt-BR-FranciscaNeural',
    Spanish: 'es-ES-ElviraNeural',
    English: 'en-US-JennyNeural',
    // Add more as needed
  } as Record<string, string>
} 