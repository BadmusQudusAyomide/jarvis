import { llmService } from './llm'
import { tryAutomationForTarget } from './automation'
import { getWeatherResponse } from './weather'
import { getWikiSummary } from './wiki'
import { getCalcResult } from './calc'
import { buildGoogleUrl, canFetchGoogleResults, fetchGoogleTopResults, formatBestGoogleInsight } from './search'
import { canFetchNews, fetchTopHeadlines, formatHeadlineList, detectCountryCodes, fetchHeadlinesByCountries, formatHeadlinesByCountry } from './news'
import { getDefinitionResponse } from './dictionary'
import { detectTimeDateIntent, getTimeDateResponse } from './time'
import { getCurrencyConversionResponse } from './currency'
import { MOTIVATIONAL_QUOTES, JOKES, PRODUCTIVITY_TIPS, EASTER_EGGS } from '../constants/responses'
import { URL_MAP } from '../constants/urls'

export class ResponseGenerator {
  private conversationHistory: string[] = []
  private maxHistoryLength = 6

  addToHistory(message: string, role: 'user' | 'assistant') {
    this.conversationHistory.push(`${role}: ${message}`)
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift()
    }
  }

  async generateResponse(text: string): Promise<string> {
    const lower = text.toLowerCase().trim()
    console.log('🎯 RESPONSE GENERATOR CALLED WITH:', text)

    // Add user message to history
    this.addToHistory(text, 'user')

    try {
      // Try LLM first for intelligent responses
      if (llmService.isConfigured()) {
        console.log('🚀 LLM is configured, using for response generation')
        // Check if this is a simple command that should use built-in handlers
        const shouldUseBuiltIn = this.shouldUseBuiltInHandler(lower)
        console.log('🔍 Should use built-in handler:', shouldUseBuiltIn, 'for query:', lower)
        
        if (shouldUseBuiltIn) {
          const builtInResponse = await this.handleBuiltInCommands(text, lower)
          if (builtInResponse) {
            console.log('⚡ Using built-in response:', builtInResponse.substring(0, 50) + '...')
            this.addToHistory(builtInResponse, 'assistant')
            return builtInResponse
          }
        }

        // Use LLM for complex queries and conversations
        console.log('🧠 Using LLM for complex query:', text)
        const context = this.conversationHistory.slice(-4) // Last 4 messages for context
        const llmResponse = await llmService.generateResponse(text, context)
        console.log('✅ LLM response received:', llmResponse.substring(0, 50) + '...')
        this.addToHistory(llmResponse, 'assistant')
        return llmResponse
      } else {
        console.log('❌ LLM not configured - API key missing')
      }

      // Fallback to built-in handlers
      const response = await this.handleBuiltInCommands(text, lower)
      this.addToHistory(response, 'assistant')
      return response
    } catch (error) {
      console.error('Response generation error:', error)
      const fallback = await llmService.generateFallbackResponse(text)
      this.addToHistory(fallback, 'assistant')
      return fallback
    }
  }

  private shouldUseBuiltInHandler(lower: string): boolean {
    const builtInPatterns = [
      /^(calc|calculate|compute|evaluate)\b/i,
      /^play\s+(.+?)\s+(?:on\s+)?youtube\s*$/i,
      /^(?:open\s+)?youtube\s+(?:and\s+)?(?:search\s+for\s+|search\s+)?(.+)$/i,
      /^open\s+(?:the\s+)?([\w\- ]+)$/,
      /(\bnews\b|headline|headlines|breaking)/i,
      /^(what\s+does\s+.+\s+mean\??|define\s+.+|(?:the\s+)?definition\s+of\s+.+|(?:the\s+)?meaning\s+of\s+.+)$/i,
      /(weather|temperature|rain|sunny|cloudy|forecast)/i
    ]

    return builtInPatterns.some(pattern => pattern.test(lower))
  }

  private async handleBuiltInCommands(text: string, lower: string): Promise<string> {
    // Calculator mode
    if (/^(calc|calculate|compute|evaluate)\b/i.test(text) || /[\d)(][\d\s+\-*/^x%().]+$/i.test(text)) {
      try {
        return getCalcResult(text)
      } catch {
        return 'I could not evaluate that expression. Try something like: calculate 12.5% of 240, or (2+3)*4.'
      }
    }

    // YouTube Search & Open
    const ytMatch = (
      text.match(/^play\s+(.+?)\s+(?:on\s+)?youtube\s*$/i) ||
      text.match(/^(?:open\s+)?youtube\s+(?:and\s+)?(?:search\s+for\s+|search\s+)?(.+)$/i) ||
      text.match(/^youtube\s+(.+)$/i) ||
      text.match(/^(?:play|search)\s+(.+)\s+on\s+youtube\s*$/i)
    )
    if (ytMatch) {
      const q = ytMatch[1].trim().replace(/[.?!]$/, '')
      try {
        if (canFetchGoogleResults()) {
          const results = await fetchGoogleTopResults(q, 5)
          if (results.length) {
            const reply = formatBestGoogleInsight(q, results)
            const link = results[0]?.link
            if (link) {
              setTimeout(() => {
                try { window.open(link, '_blank', 'noopener,noreferrer') } catch { /* ignore */ }
              }, 5000)
            }
            return reply
          }
        }
      } catch { /* ignore and fall back to opening */ }
      try {
        window.open(buildGoogleUrl(q), '_blank', 'noopener,noreferrer')
      } catch { /* ignore */ }
      return `Opening Google for "${q}" in your browser.`
    }

    // Time & Date
    const intent = detectTimeDateIntent(text)
    if (intent) return getTimeDateResponse(intent)

    // Currency Conversion
    const conv = await getCurrencyConversionResponse(text)
    if (conv) return conv

    // Dictionary / Definitions
    if (/^(what\s+does\s+.+\s+mean\??|define\s+.+|(?:the\s+)?definition\s+of\s+.+|(?:the\s+)?meaning\s+of\s+.+)$/i.test(text.trim())) {
      return await getDefinitionResponse(text)
    }

    // News
    if (/(\bnews\b|headline|headlines|breaking)/i.test(lower)) {
      try {
        if (canFetchNews()) {
          const codes = detectCountryCodes(lower)
          if (codes.length) {
            const groups = await fetchHeadlinesByCountries(codes, 3)
            const grouped = formatHeadlinesByCountry(groups, 3)
            if (grouped) return grouped
          }
          const articles = await fetchTopHeadlines(5)
          if (articles.length) return formatHeadlineList(articles, 5)
        }
      } catch { /* ignore and fall back */ }
      return "I couldn't fetch headlines right now."
    }

    // Enhanced motivation system
    if (/(motivate|inspire|encourage|boost|pump up)/.test(lower)) {
      const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
      return `Here's some motivation for you: "${quote}" Now go make it happen! 💪`
    }

    // Productivity tips
    if (/(productive|productivity|focus|work better|efficient)/.test(lower)) {
      const tip = PRODUCTIVITY_TIPS[Math.floor(Math.random() * PRODUCTIVITY_TIPS.length)]
      return `Pro tip: ${tip} You've got this! 🚀`
    }

    // Google Search
    const searchMatch = text.match(/^(?:search\s+(?:google\s+)?for|google\s+search\s+for|google\s+)(.+)$/i)
    if (searchMatch) {
      const q = searchMatch[1].trim().replace(/[.?!]$/, '')
      try {
        if (canFetchGoogleResults()) {
          const results = await fetchGoogleTopResults(q, 5)
          if (results.length) {
            const reply = formatBestGoogleInsight(q, results)
            const link = results[0]?.link
            if (link) {
              setTimeout(() => {
                try { window.open(link, '_blank', 'noopener,noreferrer') } catch { /* ignore */ }
              }, 5000)
            }
            return reply
          }
        }
      } catch { /* ignore and fall back to opening */ }
      try {
        window.open(buildGoogleUrl(q), '_blank', 'noopener,noreferrer')
      } catch { /* ignore */ }
      return `Opening Google for "${q}" in your browser.`
    }

    // Wikipedia lookup
    if (/(^|\b)(wikipedia|who\s+(is|was)|what\s+is|tell\s+me\s+about)(\b|\s)/i.test(lower)) {
      return await getWikiSummary(text)
    }

    // Enhanced jokes
    if (/(joke|funny|humor|laugh)/.test(lower)) {
      const joke = JOKES[Math.floor(Math.random() * JOKES.length)]
      return `Here's one for you: ${joke} 😄`
    }

    // Weather
    if (/(weather|temperature|rain|sunny|cloudy|forecast)/.test(lower)) {
      try {
        return await getWeatherResponse(text)
      } catch {
        return "I'd love to check the weather for you, but I don't have access to real-time data. Try asking your phone's weather app!"
      }
    }

    // Enhanced identity responses
    if (/(who are you|what are you|introduce yourself)/.test(lower)) {
      return "I'm JARVIS - your advanced AI voice assistant. I'm here to help you stay productive, motivated, and entertained. Think of me as your digital companion! 🤖"
    }

    // Self-identity and creator information
    if (/(who is your (boss|owner|creator)|who (made|created|built) you|who are you|are you jarvis)/i.test(lower)) {
      return `I am Jarvis, your AI assistant created by Badmus Qudus Ayomide. ` +
        `I'm here to help with tasks, answer questions, and make your life easier. ` +
        `You can think of me as your personal digital assistant.`
    }

    // About the creator
    if (/(who is (badmus|qudus|badmus qudus|badmus qudus ayomide))/i.test(lower)) {
      return `Badmus Qudus Ayomide is my creator and owner. ` +
        `He's a talented developer who built me to assist with daily tasks and automation. ` +
        `You can call him Qudus for short.`
    }

    if (/(what can you do|what are your (skills|capabilities|features)|help)/i.test(lower)) {
      return `I can help you with many things, including:\n` +
        `• Answering questions and providing information\n` +
        `• Performing calculations and conversions\n` +
        `• Opening applications and websites\n` +
        `• Searching the web and summarizing results\n` +
        `• Telling jokes and providing motivation\n` +
        `• And much more! Just ask me what you'd like to do.`
    }

    // Greeting with name
    if (/(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|yo|what's up)/i.test(lower)) {
      const greetings = [
        `Hello Boss! How can I assist you today?`,
        `Hi there! What can I do for you?`,
        `Hey! How can I help?`,
        `Greetings! What would you like to know?`,
        `Good day! How may I be of service?`
      ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }

    // Enhanced link opening
    const openMatch = lower.match(/^open\s+(?:the\s+)?([\w\- ]+)$/)
    if (openMatch) {
      const target = openMatch[1].trim()
      // First, try local PC automation via backend
      try {
        const automation = await tryAutomationForTarget(target)
        if (automation.handled) {
          return automation.result?.status === 'success'
            ? `Opening ${target} on your PC...`
            : `Couldn't open ${target}: ${automation.result?.message}`
        }
      } catch { /* ignore and fall back to web */ }

      const url = URL_MAP[target]
      if (url) {
        try {
          window.open(url, '_blank', 'noopener,noreferrer')
          const pretty = target.replace(/\b\w/g, (c: string) => c.toUpperCase())
          return `Opening ${pretty}. Happy browsing! 🌐`
        } catch {
          return `I couldn't open ${target}. Check your browser settings.`
        }
      }
      return `I don't recognize "${target}". Try: YouTube, Google, GitHub, Gmail, Netflix, Spotify, Discord, or WhatsApp.`
    }

    // Easter eggs
    for (const key of Object.keys(EASTER_EGGS)) {
      if (lower.includes(key)) {
        const val = EASTER_EGGS[key]
        return typeof val === 'function' ? val() : val
      }
    }

    // Smart fallback with suggestions
    if (text.endsWith('?')) {
      return `Interesting question: "${text}" I'm still learning, but I can help with time, weather info, motivation, jokes, opening websites, and productivity tips!`
    }

    // Check if this looks like a complex query that should use LLM
    const complexPatterns = [
      /explain/i, /what is/i, /how does/i, /tell me about/i, /describe/i, /define/i
    ]
    
    if (complexPatterns.some(pattern => pattern.test(text))) {
      return `That's an interesting topic about "${text}". I'd love to explain it properly, but I need my AI brain configured first. Ask me about the time, weather, or to open websites for now! 🧠`
    }

    return `You said: "${text}" - I heard you loud and clear! Try asking for the time, motivation, or tell me to open a website! 🎯`
  }

  clearHistory() {
    this.conversationHistory = []
  }
}

export const responseGenerator = new ResponseGenerator()
