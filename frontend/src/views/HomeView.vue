<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { API_ENDPOINTS } from '../config'
import { InfoFilled } from '@element-plus/icons-vue'

const DEFAULT_DECK_NAME = 'Flash Forge'
const inputTextName = ref(DEFAULT_DECK_NAME)
const inputTextWords = ref('')
const targetLanguage = ref('Portuguese (Brazil)')
const sourceLanguage = ref('English')
const includeReversedCards = ref(false)
const isLoading = ref(false)
const MAX_LINES = 50

const lineCount = computed(() => inputTextWords.value ? inputTextWords.value.split('\n').length : 0)
const isOverLineLimit = computed(() => lineCount.value > MAX_LINES)

const downloadFile = (content: string, filename: string) => {
  // Convert base64 to binary
  const binaryString = window.atob(content)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: 'application/octet-stream' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

const handleSubmit = async () => {
  if (!inputTextWords.value.trim()) {
    ElMessage.warning('Please enter some words')
    return
  }

  const lines = inputTextWords.value.split('\n')
  if (lines.length > MAX_LINES) {
    ElMessage.warning(`You can only enter up to ${MAX_LINES} lines.`)
    return
  }

  isLoading.value = true
  
  try {
    const response = await axios.post(API_ENDPOINTS.GENERATE_CARDS, {
      deckName: inputTextName.value.trim() || DEFAULT_DECK_NAME,
      words: inputTextWords.value.trim(),
      targetLanguage: targetLanguage.value,
      sourceLanguage: sourceLanguage.value,
      includeReversedCards: includeReversedCards.value
    }, {
      responseType: 'json' // Ensure we get JSON response
    })
    
    console.log('Backend response:', response.data)
    
    // Download each APKG file
    for (const file of response.data.apkgFiles) {
      downloadFile(file.content, file.name)
    }
    
    ElMessage.success('Decks generated and downloaded successfully!')
    
    // Reset form
    inputTextWords.value = ''
    inputTextName.value = DEFAULT_DECK_NAME
  } catch (error) {
    console.error('Error sending request:', error)
    ElMessage.error('Failed to generate decks')
  } finally {
    isLoading.value = false
  }
}

watch(inputTextWords, (newVal) => {
  const lines = newVal.split('\n')
  if (lines.length > MAX_LINES) {
    inputTextWords.value = lines.slice(0, MAX_LINES).join('\n')
    ElMessage.warning(`You can only enter up to ${MAX_LINES} lines.`)
  }
})
</script>

<template>
  <div class="container">
    <el-card class="form-card">
      <template #header>
        <h2>Flash Forge</h2>
      </template>
      
      <el-form @submit.prevent="handleSubmit" label-position="top">
        <el-form-item label="Deck Name">
          <el-input
            v-model="inputTextName"
            placeholder="Enter deck name (optional)"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <template #label>
            <span style="font-weight: bold;">
              Words
            </span>
            <el-tooltip 
              raw-content
              content="- Enter up to 50 lines (words or phrases).<br>- Each line will generate a separate flashcard.<br>- You can write in either the source or target language.<br>- Optionally, add a translation or example sentence to provide context for each card separated by a dash. E.g.<br>&nbsp;&nbsp;&nbsp;&nbsp;- To Swim - Nadar<br>&nbsp;&nbsp;&nbsp;&nbsp;- Ganhar - I got a prize"
              placement="right-start"
            >
              <el-icon style="margin-left: 6px; cursor: pointer; vertical-align: middle;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </template>
          <el-input
            v-model="inputTextWords"
            type="textarea"
            :rows="10"
            placeholder="Hello
Thank you
Sim
Paracer - to seem   
Não - not this time
Claro que - Claro que eu posso "
            resize="none"
          />
          <div style="margin-top: 0.5rem; font-size: 0.95em;">
            <span :style="{ color: isOverLineLimit ? 'red' : '#888' }">
              {{ lineCount }} / {{ MAX_LINES }} lines
            </span>
            <span v-if="isOverLineLimit" style="color: red; margin-left: 1em;">
              You can only enter up to {{ MAX_LINES }} lines.
            </span>
          </div>
        </el-form-item>

        <el-form-item label="Target Language">
          <template #label>
            <span style="font-weight: bold;">
              Target Language
            </span>
            <el-tooltip 
              raw-content
              content="The language you want to learn or practice. Flashcards will be generated in this language."
              placement="right-start"
            >
              <el-icon style="margin-left: 6px; cursor: pointer; vertical-align: middle;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </template>
          <el-select v-model="targetLanguage" placeholder="Select language">
            <el-option label="Arabic" value="Arabic" />
            <el-option label="Mandarin Chinese" value="Mandarin Chinese" />
            <el-option label="Japanese" value="Japanese" />
            <el-option label="Spanish" value="Spanish" />
            <el-option label="Portuguese (Brazil)" value="Portuguese (Brazil)" />
            <el-option label="English" value="English" />
          </el-select>
        </el-form-item>

        <el-form-item label="Source Language">
          <template #label>
            <span style="font-weight: bold;">
              Source Language
            </span>
            <el-tooltip 
              raw-content
              content="The language you are translating from."
              placement="right-start"
            >
              <el-icon style="margin-left: 6px; cursor: pointer; vertical-align: middle;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </template>
          <el-select v-model="sourceLanguage" placeholder="Select language">
            <el-option label="Arabic" value="Arabic" />
            <el-option label="Mandarin Chinese" value="Mandarin Chinese" />
            <el-option label="Japanese" value="Japanese" />
            <el-option label="Spanish" value="Spanish" />
            <el-option label="Portuguese (Brazil)" value="Portuguese (Brazil)" />
            <el-option label="English" value="English" />
          </el-select>
        </el-form-item>

        <el-form-item label="Card Type">
          <template #label>
            <span style="font-weight: bold;">
              Card Type
            </span>
            <el-tooltip 
              raw-content
              content="By default, the front of each flashcard shows the word in your target language, and the back shows the translation in your source language.<br>When you enable Reverse Cards, a second set of cards is created with the sides flipped—showing the source language on the front and the target language on the back."
              placement="right-start"
            >
              <el-icon style="margin-left: 6px; cursor: pointer; vertical-align: middle;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </template>
          <el-switch
            v-model="includeReversedCards"
            active-text="Include reversed cards"
            inactive-text=""
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            native-type="submit"
            :loading="isLoading"
            :disabled="isOverLineLimit"
            :style="isOverLineLimit ? 'opacity: 0.5; pointer-events: none;' : ''"
          >
            Generate Decks
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.form-card {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

:deep(.el-card__header) {
  text-align: center;
  padding: 1.5rem;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
  text-align: center;
}

:deep(.el-form-item__label) {
  font-weight: bold;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-form-item) {
  margin-bottom: 1.5rem;
}

:deep(.el-input) {
  width: 100%;
}

:deep(.el-form) {
  width: 100%;
}
</style>
