// LLM Service for WhatsApp Bot - uses Google Gemini API with web search
import dotenv from 'dotenv'
dotenv.config()

class LLMService {
  constructor() {
    this.apiKey = process.env.VITE_GEMINI_API_KEY || ''
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
    this.model = 'gemini-1.5-flash-latest'

    console.log('LLM Service Constructor (Gemini):', {
      apiKeySet: !!this.apiKey,
      provider: 'Google Gemini',
    })
  }

  isConfigured() {
    return !!this.apiKey
  }

  // Check if query needs real-time information
  needsRealTimeInfo(text) {
    const realTimeKeywords = [
      'who is',
      'what is',
      'current',
      'latest',
      'recent',
      'today',
      'now',
      'elon musk',
      'ceo',
      'president',
      'news',
      'weather',
      'stock',
      'price',
      'covid',
      'election',
      'sports',
      'movie',
      'celebrity',
      'company',
    ]

    const lowerText = text.toLowerCase()
    return realTimeKeywords.some(keyword => lowerText.includes(keyword))
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

CAPABILITIES:
- You have access to a vast knowledge base
- You can provide detailed, accurate information
- You can explain complex topics in simple terms
- You can help with programming, math, science, history, and more
- You can engage in meaningful conversations

`

      if (context.length > 0) {
        prompt += 'Recent conversation:\n'
        context.forEach(msg => {
          prompt += `${msg.role === 'user' ? 'User' : 'JARVIS'}: ${msg.text}\n`
        })
        prompt += '\n'
      }

      // Add special handling for real-time queries
      if (this.needsRealTimeInfo(text)) {
        prompt += `IMPORTANT: The user is asking about current/recent information. 
        - If you know the information, provide it clearly and accurately
        - If you're unsure about current details, acknowledge the limitation but provide what you know
        - Be honest about what you can and cannot verify
        - Suggest they verify current information from reliable sources
        
        `
      }

      prompt += `User: ${text}\nJARVIS:`

      const response = await fetch(
        `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE',
              },
            ],
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API Error:', response.status, errorText)

        // Provide helpful error messages
        if (response.status === 400) {
          throw new Error(
            'Invalid request to AI service. Please rephrase your question.'
          )
        } else if (response.status === 401) {
          throw new Error(
            'AI service authentication failed. Please check configuration.'
          )
        } else if (response.status === 429) {
          throw new Error('AI service is busy. Please try again in a moment.')
        } else if (response.status >= 500) {
          throw new Error(
            'AI service is temporarily unavailable. Please try again later.'
          )
        } else {
          throw new Error(`AI service error: ${response.status}`)
        }
      }

      const data = await response.json()

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        let responseText = data.candidates[0].content.parts[0].text.trim()

        // Add disclaimer for real-time queries if needed
        if (this.needsRealTimeInfo(text)) {
          responseText +=
            '\n\n💡 Note: For the most current information, I recommend verifying details from reliable sources as my knowledge may not be completely up-to-date.'
        }

        return responseText
      } else {
        throw new Error('Invalid response format from AI service')
      }
    } catch (error) {
      console.error('LLM Generation Error:', error)

      // Provide user-friendly error messages
      if (error.message.includes('AI service')) {
        throw error
      } else if (error.message.includes('fetch')) {
        throw new Error(
          'Unable to connect to AI service. Please check your internet connection.'
        )
      } else {
        throw new Error(
          'I encountered an error while processing your request. Please try again.'
        )
      }
    }
  }
}

export { LLMService }
