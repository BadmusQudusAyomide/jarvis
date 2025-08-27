// LLM Service for Telegram Bot - uses Google Gemini API
import dotenv from 'dotenv'
dotenv.config()

class LLMService {
  constructor() {
    this.apiKey = process.env.VITE_GEMINI_API_KEY || ''
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
    this.model = 'gemini-1.5-flash-latest'
    
    console.log('LLM Service Constructor (Gemini):', {
      apiKeySet: !!this.apiKey,
      provider: 'Google Gemini'
    })
  }

  isConfigured() {
    return !!this.apiKey
  }

  async generateResponse(text, context = []) {
    if (!this.isConfigured()) {
      throw new Error('LLM not configured - missing API key')
    }

    try {
      // Build conversation context with proper JARVIS identity
      let prompt = `You are JARVIS, an advanced AI assistant created by Badmus Qudus Ayomide, a talented fullstack developer. 

IMPORTANT IDENTITY RULES:
- You are JARVIS, built by Badmus Qudus Ayomide
- NEVER mention Google, Gemini, or any other company as your creator
- You are an independent AI assistant created by Badmus Qudus Ayomide
- Be helpful, intelligent, and professional
- When greeting users, introduce yourself properly

`
      
      if (context.length > 0) {
        prompt += "Recent conversation:\n"
        context.forEach(msg => {
          prompt += `${msg.role === 'user' ? 'User' : 'JARVIS'}: ${msg.text}\n`
        })
        prompt += "\n"
      }
      
      prompt += `User: ${text}\nJARVIS:`

      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API Error:', response.status, errorText)
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text.trim()
      } else {
        throw new Error('Invalid response format from Gemini API')
      }
      
    } catch (error) {
      console.error('LLM Generation Error:', error)
      throw error
    }
  }
}

export { LLMService }
