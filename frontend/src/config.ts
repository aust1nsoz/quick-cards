// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const API_ENDPOINTS = {
  GENERATE: `${API_BASE_URL}/generate`
}

// Other configuration constants can be added here 