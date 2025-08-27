// Full JARVIS response generator for Telegram bot - same as web app
import { LLMService } from './llm.js'
import { saveMessage, semanticRecall, isMemoryQuery } from './supabase.js'

const llmService = new LLMService()

class ResponseGenerator {
  constructor() {
    this.conversationHistory = []
  }

  addToHistory(text, role) {
    this.conversationHistory.push({ text, role })
    // Keep only last 10 messages to manage memory
    if (this.conversationHistory.length > 10) {
      this.conversationHistory = this.conversationHistory.slice(-10)
    }
  }

  shouldUseBuiltInHandler(text) {
    const lower = text.toLowerCase()
    
    // Simple commands that don't need LLM
    const simpleCommands = [
      /^(hi|hello|hey)$/,
      /^(time|what time)/,
      /^(date|what date)/,
      /^(weather)/,
      /^(news)/,
      /^\d+[\+\-\*\/]\d+/  // Simple math
    ]
    
    return simpleCommands.some(pattern => pattern.test(lower))
  }

  async handleBuiltInCommands(text) {
    const lower = text.toLowerCase()
    
    // Greetings
    if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(lower)) {
      return "Hello! I'm JARVIS, an advanced AI assistant built by Badmus Qudus Ayomide, a talented fullstack developer. I'm here to help you with anything you need - from answering questions to solving complex problems. How can I assist you today?"
    }
    
    // Time
    if (/^(time|what time)/.test(lower)) {
      return `The current time is ${new Date().toLocaleTimeString()}`
    }
    // Who am I / About
    if (/^(who are you|what are you|about|info|who created you|who built you|who owns you)$/i.test(lower)) {
      return "I'm JARVIS, an advanced AI assistant created by Badmus Qudus Ayomide, a skilled fullstack developer. I'm designed to be intelligent, helpful, and capable of handling complex tasks. I can assist with programming, answer questions, perform calculations, and much more!"
    }
    
    // Date
    if (/^(date|what date)/.test(lower)) {
      return `Today is ${new Date().toLocaleDateString()}`
    }
    
    // Weather (placeholder - you can integrate weather API)
    if (/^weather/.test(lower)) {
      return "Weather feature coming soon! Please provide your weather API key in the .env file."
    }
    
    // News (placeholder)
    if (/^news/.test(lower)) {
      return "News feature coming soon! Please provide your news API key in the .env file."
    }
    
    // Simple math
    const mathMatch = text.match(/^(\d+)\s*([\+\-\*\/])\s*(\d+)$/)
    if (mathMatch) {
      const [, a, op, b] = mathMatch
      const num1 = parseInt(a)
      const num2 = parseInt(b)
      let result
      
      switch (op) {
        case '+': result = num1 + num2; break
        case '-': result = num1 - num2; break
        case '*': result = num1 * num2; break
        case '/': result = num2 !== 0 ? num1 / num2 : 'Cannot divide by zero'; break
        default: return 'Invalid operation'
      }
      
      return `${num1} ${op} ${num2} = ${result}`
    }
    
    return null
  }

  // Build concise memory-based answers (same logic as web app)
  buildConciseMemoryAnswer(query, memories) {
    const q = query.toLowerCase()
    
    // Birthday queries
    if (/(when.*born|birthday|birth date)/i.test(q)) {
      const birthdayMemory = memories.find(m => 
        /birthday|born|birth/.test(m.text.toLowerCase()) && 
        /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{1,2}/.test(m.text)
      )
      if (birthdayMemory) {
        const dateMatch = birthdayMemory.text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{1,2}/)
        if (dateMatch) return `Your birthday is ${dateMatch[0]}.`
      }
    }
    
    // Name queries
    if (/(what.*my name|who am i)/i.test(q)) {
      const nameMemory = memories.find(m => /my name is|i am|call me/i.test(m.text))
      if (nameMemory) {
        const nameMatch = nameMemory.text.match(/(?:my name is|i am|call me)\s+([^.!?]+)/i)
        if (nameMatch) return `Your name is ${nameMatch[1].trim()}.`
      }
    }
    
    return null
  }

  async generateResponse(text, userId = 'telegram_user') {
    console.log('🎯 TELEGRAM BOT - Processing message:', text)
    
    // Save user message to Supabase
    await saveMessage('you', text, userId)
    this.addToHistory(text, 'user')
    
    try {
      // Check for memory queries first (same as web app)
      if (isMemoryQuery(text)) {
        console.log('🔍 Memory query detected, searching Supabase...')
        const memories = await semanticRecall(text, 8)
        
        if (memories && memories.length > 0) {
          // Try to build concise answer from memories
          const conciseAnswer = this.buildConciseMemoryAnswer(text, memories)
          if (conciseAnswer) {
            console.log('✅ Found memory-based answer')
            await saveMessage('jarvis', conciseAnswer, userId)
            this.addToHistory(conciseAnswer, 'assistant')
            return conciseAnswer
          }
        }
      }
      
      // Check if LLM is configured
      if (llmService.isConfigured()) {
        console.log('🚀 LLM is configured, checking for built-in commands')
        
        // Check for simple built-in commands first
        if (this.shouldUseBuiltInHandler(text)) {
          const builtInResponse = await this.handleBuiltInCommands(text)
          if (builtInResponse) {
            console.log('⚡ Using built-in response')
            await saveMessage('jarvis', builtInResponse, userId)
            this.addToHistory(builtInResponse, 'assistant')
            return builtInResponse
          }
        }
        
        // Use LLM for complex queries
        console.log('🧠 Using LLM for complex query')
        const context = this.conversationHistory.slice(-4)
        const llmResponse = await llmService.generateResponse(text, context)
        console.log('✅ LLM response received')
        await saveMessage('jarvis', llmResponse, userId)
        this.addToHistory(llmResponse, 'assistant')
        return llmResponse
        
      } else {
        console.log('❌ LLM not configured - using built-in only')
        const response = await this.handleBuiltInCommands(text)
        if (response) {
          await saveMessage('jarvis', response, userId)
          this.addToHistory(response, 'assistant')
          return response
        }
        const fallback = "I'm sorry, I need my AI configuration to answer that. Please check the API keys."
        await saveMessage('jarvis', fallback, userId)
        return fallback
      }
      
    } catch (error) {
      console.error('❌ Response generation error:', error)
      const fallback = "I encountered an error processing your request. Please try again."
      await saveMessage('jarvis', fallback, userId)
      this.addToHistory(fallback, 'assistant')
      return fallback
    }
  }
}

export { ResponseGenerator }
