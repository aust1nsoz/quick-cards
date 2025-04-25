<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const DEFAULT_DECK_NAME = 'my_new_anki_deck'
const inputTextName = ref(DEFAULT_DECK_NAME)
const inputTextWords = ref('')
const targetLanguage = ref('Portuguese')
const sourceLanguage = ref('English')
const isLoading = ref(false)

const handleSubmit = async () => {
  if (!inputTextWords.value.trim()) {
    ElMessage.warning('Please enter some words')
    return
  }

  isLoading.value = true
  
  try {
    const response = await axios.post('http://localhost:3000/generate', {
      deckName: inputTextName.value.trim() || DEFAULT_DECK_NAME,
      words: inputTextWords.value.trim(),
      targetLanguage: targetLanguage.value,
      sourceLanguage: sourceLanguage.value
    })
    
    console.log('Backend response:', response.data)
    ElMessage.success('Request sent successfully!')
    
    // Reset form
    inputTextWords.value = ''
    inputTextName.value = DEFAULT_DECK_NAME
  } catch (error) {
    console.error('Error sending request:', error)
    ElMessage.error('Failed to send request to backend')
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
            <el-option label="Portuguese" value="Portuguese" />
            <el-option label="English" value="English" />
          </el-select>
        </el-form-item>

        <el-form-item label="Source Language">
          <el-select v-model="sourceLanguage" placeholder="Select language">
            <el-option label="Spanish" value="Spanish" />
            <el-option label="Portuguese" value="Portuguese" />
            <el-option label="English" value="English" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            native-type="submit"
            :loading="isLoading"
          >
            Submit
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}

.form-card {
  width: 100%;
  max-width: 800px;
}

:deep(.el-card__header) {
  text-align: center;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
  text-align: center;
}

:deep(.el-form-item__label) {
  font-weight: bold;
}
</style>
