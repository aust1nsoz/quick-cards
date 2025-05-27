<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { API_ENDPOINTS } from '../config'
import debounce from 'lodash/debounce'

interface PreviewCard {
  front: string
  back: string
}

const DEFAULT_DECK_NAME = 'Flash Forge'
const inputTextName = ref(DEFAULT_DECK_NAME)
const inputTextWords = ref('')
const targetLanguage = ref('Portuguese (Brazil)')
const sourceLanguage = ref('English')
const includeReversedCards = ref(false)
const isLoading = ref(false)
const MAX_LINES = 50

// Preview state
const hasPreviewed = ref(false)
const previewCard = ref<PreviewCard | null>(null)
const isGeneratingPreview = ref(false)

const lineCount = computed(() => inputTextWords.value ? inputTextWords.value.split('\n').length : 0)
const isOverLineLimit = computed(() => lineCount.value > MAX_LINES)

// Debounced preview function
const debouncedPreview = debounce(async (input: string) => {
  if (isGeneratingPreview.value) return
  
  const lines = input.split('\n').filter(line => line.trim().length > 0)
  if (lines.length < 2) return

  isGeneratingPreview.value = true
  try {
    const response = await axios.post(API_ENDPOINTS.PREVIEW_CARD, {
      input,
      targetLanguage: targetLanguage.value,
      sourceLanguage: sourceLanguage.value
    })
    previewCard.value = response.data.card
    hasPreviewed.value = true
  } catch (error) {
    console.error('Error generating preview:', error)
    ElMessage.error('Failed to generate preview')
  } finally {
    isGeneratingPreview.value = false
  }
}, 1000)

// Watch for input changes
watch(inputTextWords, (newVal) => {
  const lines = newVal.split('\n')
  if (lines.length > MAX_LINES) {
    inputTextWords.value = lines.slice(0, MAX_LINES).join('\n')
    ElMessage.warning(`You can only enter up to ${MAX_LINES} lines.`)
  }

  // Only reset preview if the first line changes
  if (hasPreviewed.value) {
    const oldFirstLine = inputTextWords.value.split('\n')[0].trim()
    const newFirstLine = newVal.split('\n')[0].trim()
    if (oldFirstLine !== newFirstLine) {
      previewCard.value = null
    }
  }

  // Trigger preview if we have enough lines
  const nonEmptyLines = lines.filter(line => line.trim().length > 0)
  if (nonEmptyLines.length >= 2 && !hasPreviewed.value) {
    debouncedPreview(newVal)
  }
})

// Manual preview trigger
const triggerPreview = () => {
  if (inputTextWords.value.trim()) {
    debouncedPreview(inputTextWords.value)
  }
}

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

const formatCardText = (text: string) => {
  return text.replace(/<br>/g, '\n')
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
      responseType: 'json'
    })
    
    console.log('Backend response:', response.data)
    
    // Download each APKG file
    for (const file of response.data.apkgFiles) {
      downloadFile(file.content, file.name)
    }
    
    ElMessage.success('Decks generated and downloaded successfully!')
    
    // Reset form and preview state
    inputTextWords.value = ''
    inputTextName.value = DEFAULT_DECK_NAME
    previewCard.value = null
    hasPreviewed.value = false
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
    <div class="card">
      <form @submit.prevent="handleSubmit">
        <div class="form-section">
          <label class="label" for="deckName">Deck Name</label>
          <input
            id="deckName"
            v-model="inputTextName"
            class="input"
            placeholder="Enter deck name (optional)"
            autocomplete="off"
          />
        </div>
        <div class="form-section">
          <label class="label" for="words">Words <span class="info-icon" title="Each line will generate a separate flashcard. Optionally, add a translation or example sentence to provide context for each card separated by a dash.">ⓘ</span></label>
          <textarea
            id="words"
            v-model="inputTextWords"
            class="textarea"
            rows="8"
            placeholder="Hello
Thank you
Sim
Paracer - to seem   
Não - not this time
Claro que - Claro que eu posso "
            resize="none"
          />
          <div class="line-count">{{ lineCount }} / {{ MAX_LINES }} lines</div>
        </div>
        <div v-if="previewCard" class="preview-card-section card">
          <div class="preview-title">Preview Card</div>
          <div class="preview-row">
            <div class="preview-side">
              <div class="preview-label">Front</div>
              <div class="preview-content">{{ formatCardText(previewCard.front) }}</div>
            </div>
            <div class="preview-side">
              <div class="preview-label">Back</div>
              <div class="preview-content">{{ formatCardText(previewCard.back) }}</div>
            </div>
          </div>
          <button type="button" class="preview-btn" @click="triggerPreview" :disabled="isGeneratingPreview">
            &#8635; Preview Again
          </button>
        </div>
        <div class="settings-row card">
          <div class="settings-top">
            <div class="settings-col">
              <label class="label">Target Language <span class="info-icon" title="The language you want to learn or practice.">ⓘ</span></label>
              <select v-model="targetLanguage" class="select">
                <option>Portuguese (Brazil)</option>
                <option>Spanish</option>
                <option>Japanese</option>
                <option>Mandarin Chinese</option>
                <option>Arabic</option>
                <option>English</option>
              </select>
            </div>
            <div class="settings-col">
              <label class="label">Source Language <span class="info-icon" title="The language you are translating from.">ⓘ</span></label>
              <select v-model="sourceLanguage" class="select">
                <option>English</option>
                <option>Portuguese (Brazil)</option>
                <option>Spanish</option>
                <option>Japanese</option>
                <option>Mandarin Chinese</option>
                <option>Arabic</option>
              </select>
            </div>
          </div>
          <div class="settings-bottom">
            <label class="label">Card Type <span class="info-icon" title="Include reversed cards.">ⓘ</span></label>
            <label class="switch">
              <input type="checkbox" v-model="includeReversedCards" />
              <span class="slider"></span>
              <span class="switch-label">Include reversed cards</span>
            </label>
          </div>
        </div>
        <div class="action-row">
          <button class="generate-btn" type="submit" :disabled="isLoading || isOverLineLimit">
            <span v-if="isLoading">Generating...</span>
            <span v-else>&#9889; Generate Decks &#9889;</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.07);
  padding: 2rem 2.5rem;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 600px;
}

.card:first-child {
  margin-top: 0;
}

.form-section {
  margin-bottom: 1.5rem;
}

.label {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  display: block;
  color: #222;
}

.input, .textarea, .select {
  width: 100%;
  border: 1.5px solid #f0cfa0;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  background: #fef6e3;
  transition: border 0.2s;
}
.input:focus, .textarea:focus, .select:focus {
  border: 1.5px solid #f2994a;
  outline: none;
}

.textarea {
  min-height: 135px;
  resize: vertical;
}

.line-count {
  font-size: 0.95em;
  color: #bfa76a;
  margin-top: 0.2rem;
}

.info-icon {
  font-size: 1em;
  margin-left: 0.3em;
  cursor: pointer;
  color: #bfa76a;
}

.preview-card-section {
  margin-bottom: 2rem;
  background: #fef6e3;
  box-shadow: 0 2px 12px 0 rgba(242, 153, 74, 0.08);
  border-radius: 16px;
  padding: 1.5rem 2rem;
}

.preview-title {
  font-weight: 700;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #222;
}

.preview-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.preview-side {
  flex: 1;
  background: #fff7ed;
  border: 1.5px solid #f0cfa0;
  border-radius: 10px;
  padding: 1rem;
  min-height: 80px;
  display: flex;
  flex-direction: column;
}

.preview-label {
  font-weight: 600;
  color: #bfa76a;
  margin-bottom: 0.5rem;
}

.preview-content {
  white-space: pre-line;
  color: #222;
  font-size: 1.05rem;
}

.preview-btn {
  background: #f2994a;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.5rem;
}
.preview-btn:disabled {
  background: #f7cfa0;
  cursor: not-allowed;
}

.settings-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: #fef6e3;
  box-shadow: 0 2px 12px 0 rgba(242, 153, 74, 0.08);
  border-radius: 16px;
  padding: 1.5rem 2rem;
}
.settings-top {
  display: flex;
  gap: 1.5rem;
}
.settings-bottom {
  margin-top: 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.switch input[type="checkbox"] {
  display: none;
}
.slider {
  width: 36px;
  height: 20px;
  background: #f0cfa0;
  border-radius: 12px;
  position: relative;
  transition: background 0.2s;
  cursor: pointer;
}
.switch input:checked + .slider {
  background: #f2994a;
}
.slider:before {
  content: '';
  position: absolute;
  left: 3px;
  top: 3px;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}
.switch input:checked + .slider:before {
  transform: translateX(16px);
}
.switch-label {
  font-size: 0.98rem;
  color: #bfa76a;
  margin-left: 0.5rem;
}

.action-row {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}
.generate-btn {
  background: #f2994a;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px 0 rgba(242, 153, 74, 0.10);
  transition: background 0.2s;
}
.generate-btn:disabled {
  background: #f7cfa0;
  cursor: not-allowed;
}
</style>
