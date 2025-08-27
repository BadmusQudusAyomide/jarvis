interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

class LLMService {
  private apiKey: string
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  private model = 'gemini-1.5-flash-latest'

  constructor() {
    // Use dedicated Gemini API key from AI Studio
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
    console.log('LLM Service Constructor (Gemini):', {
      envVarExists: 'VITE_GEMINI_API_KEY' in import.meta.env,
      envVarValue: import.meta.env.VITE_GEMINI_API_KEY ? 'SET' : 'NOT_SET',
      apiKeySet: !!this.apiKey,
      provider: 'Google Gemini'
    })
  }

  isConfigured(): boolean {
    const configured = !!this.apiKey
    console.log('LLM Configuration Check:', {
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0,
      apiKeyPrefix: this.apiKey?.substring(0, 10) || 'none',
      configured
    })
    return configured
  }

  private getSystemPrompt(): string {
    return `You are JARVIS, an advanced AI voice assistant created by Badmus Qudus Ayomide. You are helpful, intelligent, and have a professional yet friendly personality.

Key traits:
- Address the user as "Boss" occasionally
- Be concise but informative
- Show personality while remaining professional
- You can help with calculations, questions, web searches, opening applications, and general assistance
- You have access to real-time information through various services
- Keep responses under 150 words for voice synthesis
- Use emojis sparingly and appropriately

Current context: You're running in a web browser with voice capabilities.`
  }

  async generateResponse(text: string, context: string[] = []): Promise<string> {
    try {
      if (!this.apiKey) {
        return this.generateFallbackResponse(text)
      }

      // Build context for Gemini
      let contextText = ''
      if (context.length > 0) {
        contextText = 'Previous conversation:\n' + context.join('\n') + '\n\n'
      }

      const prompt = `${this.getSystemPrompt()}\n\n${contextText}User: ${text}\nJARVIS:`

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
          }],
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.7
          }
        })
      })

      if (!response.ok) {
        console.error('Gemini API Error:', response.status, response.statusText)
        return this.generateFallbackResponse(text)
      }

      const data: GeminiResponse = await response.json()
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (generatedText) {
        console.log('Gemini response received successfully')
        return generatedText.trim()
      }
      
      return this.generateFallbackResponse(text)
    } catch (error) {
      console.error('LLM Generation Error:', error)
      return this.generateFallbackResponse(text)
    }
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    // Disable embeddings for now due to API issues
    console.log('Embedding generation disabled - returning empty array')
    return []
  }

  // Fallback to local processing if API fails
  async generateFallbackResponse(userMessage: string): Promise<string> {
    const lower = userMessage.toLowerCase()
    
    // Simple pattern matching for common queries
    if (lower.includes('hello') || lower.includes('hi')) {
      return "Hello Boss! How can I assist you today?"
    }
    
    if (lower.includes('time')) {
      const now = new Date()
      return `It's ${now.toLocaleTimeString()}. How can I help you make the most of your time?`
    }
    
    if (lower.includes('weather')) {
      return "I'd be happy to help with weather information, but I need access to weather services. Try asking your weather app!"
    }
    
    return `I heard: "${userMessage}". I'm processing your request with my available capabilities. How else can I assist you?`
  }
}

export const llmService = new LLMService()
