<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'
import { API_ENDPOINTS } from '@/config'

const DEFAULT_DECK_NAME = 'my_new_anki_deck'
const inputTextName = ref(DEFAULT_DECK_NAME)
const inputTextWords = ref('')
const targetLanguage = ref('Portuguese (Brazil)')
const sourceLanguage = ref('English')
const includeReversedCards = ref(true)
const isLoading = ref(false)

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
</script>

<template>
  <div class="container">
    <el-card class="form-card">
      <template #header>
        <h2>Words for New Anki Cards</h2>
      </template>
      
      <el-form @submit.prevent="handleSubmit" label-position="top">
        <el-form-item label="Deck Name">
          <el-input
            v-model="inputTextName"
            placeholder="Enter deck name (optional)"
            clearable
          />
        </el-form-item>

        <el-form-item label="Words">
          <el-input
            v-model="inputTextWords"
            type="textarea"
            :rows="10"
            placeholder="Enter your words here..."
            resize="none"
          />
        </el-form-item>

        <el-form-item label="Target Language">
          <el-select v-model="targetLanguage" placeholder="Select language">
            <el-option label="Spanish" value="Spanish" />
            <el-option label="Portuguese (Brazil)" value="Portuguese (Brazil)" />
            <el-option label="English" value="English" />
          </el-select>
        </el-form-item>

        <el-form-item label="Source Language">
          <el-select v-model="sourceLanguage" placeholder="Select language">
            <el-option label="Spanish" value="Spanish" />
            <el-option label="Portuguese (Brazil)" value="Portuguese (Brazil)" />
            <el-option label="English" value="English" />
          </el-select>
        </el-form-item>

        <el-form-item label="Card Type">
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
