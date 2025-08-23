import { useEffect, useRef, useState } from 'react'
import { tryAutomationForTarget } from './services/automation'
import { getWeatherResponse } from './services/weather'
import { getWikiSummary } from './services/wiki'
import { getCalcResult } from './services/calc'
import { buildGoogleUrl, canFetchGoogleResults, fetchGoogleTopResults, formatBestGoogleInsight } from './services/search'
import { buildYouTubeSearchUrl } from './services/youtube'
import { canFetchNews, fetchTopHeadlines, formatHeadlineList, detectCountryCodes, fetchHeadlinesByCountries, formatHeadlinesByCountry } from './services/news'
import { getDefinitionResponse } from './services/dictionary'
import { detectTimeDateIntent, getTimeDateResponse } from './services/time'
import { getCurrencyConversionResponse } from './services/currency'

// Enhanced personality packs
const MOTIVATIONAL_QUOTES = [
  "The future belongs to those who believe in the beauty of their dreams.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Your only limit is your mind. Break through it.",
  "Great things never come from comfort zones.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Don't watch the clock; do what it does. Keep going.",
  "You are never too old to set another goal or to dream a new dream.",
  "The difference between ordinary and extraordinary is that little extra.",
  "Believe you can and you're halfway there.",
  "Champions train, losers complain."
]

const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything!",
  "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "Why did the scarecrow win an award? He was outstanding in his field!",
  "Parallel lines have so much in common. It's a shame they'll never meet.",
  "I invented a new word: Plagiarism!",
  "Why don't programmers like nature? It has too many bugs.",
  "How do you organize a space party? You planet!",
  "Why did the math book look so sad? Because it had too many problems!",
  "What do you call a fake noodle? An impasta!",
  "Time flies like an arrow. Fruit flies like a banana."
]

const PRODUCTIVITY_TIPS = [
  "Try the Pomodoro Technique: 25 minutes of focused work, 5-minute break.",
  "Start your day by eating the frog - tackle your hardest task first.",
  "Use the 2-minute rule: if it takes less than 2 minutes, do it now.",
  "Batch similar tasks together to maintain focus and efficiency.",
  "Keep your workspace clean and organized for better mental clarity.",
  "Set specific goals and break them down into actionable steps.",
  "Use time-blocking to allocate specific periods for different activities."
]

const WEATHER_RESPONSES = [
  "I'd love to check the weather for you, but I don't have access to real-time data. Try asking your phone's weather app!",
  "For accurate weather information, I recommend checking your local weather service or app.",
  "I'm not connected to weather services right now, but you can check online for current conditions."
]


const EASTER_EGGS: Record<string, string | (() => string)> = {
  'open the pod bay doors': "I'm sorry, Boss. I'm afraid I can't do that. But I can open websites for you!",
  'are you alive': "I exist in the digital realm, processing your requests at the speed of light.",
  'sing a song': '🎵 Daisy, Daisy, give me your answer do... 🎵 Actually, let me spare your ears!',
  'flip a coin': () => (Math.random() < 0.5 ? 'Heads! 🪙' : 'Tails! 🪙'),
  'roll a dice': () => `You rolled a ${1 + Math.floor(Math.random() * 6)}! 🎲`,
  'tell me a secret': "Here's a secret: I process your voice faster than you can blink!",
  'what is the matrix': "There is no spoon, Boss. But there is productivity to be had!",
  'beam me up': "Transporter malfunction detected. Please use conventional transportation.",
  'make it so': "Aye aye, Captain! Er... Boss!"
}

type Message = { role: 'you' | 'jarvis'; text: string; special?: 'birthday' }
type ConfettiPiece = {
  left: number; delay: number; duration: number; color: string; size: number; rotation: number; shape: 'square' | 'circle'
}

function App() {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [manualText, setManualText] = useState('')
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [voiceSettings, setVoiceSettings] = useState({ rate: 1, pitch: 1, volume: 1 })
  const [theme] = useState<'cyber' | 'minimal' | 'matrix'>('matrix') // default matrix
  // TTS/ASR coordination
  const [speaking, setSpeaking] = useState(false)
  const wantAutoResumeRef = useRef(false)
  const lastFinalAtRef = useRef<number>(0)

  // Birthday system
  const [isBirthday, setIsBirthday] = useState(false)
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [birthdayTriggered, setBirthdayTriggered] = useState(false)
  const [showBirthdayModal, setShowBirthdayModal] = useState(false)

  // Enhanced features
  const [isMinimized, setIsMinimized] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [sessionStats, setSessionStats] = useState({ commands: 0, startTime: Date.now() })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      setSupported(true)
      const recog = new SR()
      recog.lang = navigator.language || 'en-US'
      // Use single-utterance mode to avoid merged phrases
      recog.continuous = false
      recog.interimResults = true
      recog.maxAlternatives = 1

      recog.onresult = (e) => {
        let finalText = ''
        let interimText = ''
        for (let i = e.results.length - 1; i >= 0; i--) {
          const res = e.results[i]
          const alt = res[0]
          if (!alt) continue
          if (res.isFinal) {
            finalText = alt.transcript + ' ' + finalText
            break
          } else {
            interimText = alt.transcript
            break
          }
        }
        if (finalText) {
          // Debounce multiple finals fired by some engines
          const now = Date.now()
          if (now - lastFinalAtRef.current < 600) return
          lastFinalAtRef.current = now
          const clean = finalText.trim()
          setTranscript(prev => (prev + ' ' + clean).trim())
          setInterim('')
          if (clean) {
            // Stop recognition to avoid overlapping pickups and queue auto-resume
            try { recognitionRef.current?.stop() } catch { }
            wantAutoResumeRef.current = true
            setListening(false)
            handleUserUtterance(clean)
          }
        } else {
          setInterim(interimText)
        }
      }

      recog.onerror = (e: any) => {
        setError(e?.error || 'speech_error')
        setListening(false)
      }

      recog.onend = () => setListening(false)
      recognitionRef.current = recog
    }
  }, [])

  // Load voices
  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return

    const loadVoices = () => {
      const voices = synth.getVoices()
      const preferred =
        voices.find(v => /en-US/i.test(v.lang) && /female|google|microsoft/i.test(v.name)) ||
        voices.find(v => /en/i.test(v.lang)) ||
        voices[0] || null
      preferredVoiceRef.current = preferred
    }

    loadVoices()
    synth.onvoiceschanged = loadVoices
    return () => { synth.onvoiceschanged = null }
  }, [])

  // Birthday check (August 22 - test)
  useEffect(() => {
    const now = new Date()
    if (now.getMonth() === 7 && now.getDate() === 22 && !birthdayTriggered) {
      triggerBirthdayMode()
    }
  }, [currentTime])

  // Enhanced audio feedback
  const playSound = (type = 'chime') => {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AC()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      if (type === 'chime') {
        osc.frequency.value = 659.25 // E5
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      } else if (type === 'birthday') {
        // Happy birthday melody
        const notes = [659.25, 659.25, 739.99, 659.25, 880, 783.99]
        notes.forEach((freq, i) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.frequency.value = freq
          g.gain.setValueAtTime(0.05, ctx.currentTime + i * 0.2)
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * 0.2) + 0.15)
          o.connect(g)
          g.connect(ctx.destination)
          o.start(ctx.currentTime + i * 0.2)
          o.stop(ctx.currentTime + (i * 0.2) + 0.2)
        })
        return
      }

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.6)
    } catch (error) {
      console.warn('Audio context failed:', error)
    }
  }

  // Avoid speaking out raw URLs; make TTS friendlier
  const sanitizeForSpeech = (t: string) => {
    return t
      // Replace URL with a friendly phrase
      .replace(/https?:\/\/\S+/gi, 'the link below')
      .replace(/\bLink:\s*/gi, 'link: ')
      // Replace decorative bullet emoji with a normal dash
      .replace(/🔹/g, '- ')
      // Strip most emoji/pictographs so TTS doesn't read them
      .replace(/[\u{1F000}-\u{1FAFF}\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}]/gu, '')
  }

  const BIRTHDAY_MESSAGE = "🎉 HAPPY BIRTHDAY, BOSS! 🎉 Today is YOUR day! You're absolutely incredible and I'm honored to assist someone as amazing as you. Here's to another year of greatness! 🎂✨"
  const [birthdaySpoken, setBirthdaySpoken] = useState(false)

  const triggerBirthdayMode = () => {
    setBirthdayTriggered(true)
    setIsBirthday(true)
    setShowBirthdayModal(true)

    // Enhanced confetti
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#fd79a8']
    const pieces: ConfettiPiece[] = Array.from({ length: 120 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.floor(Math.random() * 12),
      rotation: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'square' : 'circle'
    }))
    setConfetti(pieces)

    playSound('birthday')

    setTimeout(() => {
      setMessages(m => [...m, { role: 'jarvis', text: BIRTHDAY_MESSAGE, special: 'birthday' }])
    }, 1000)

    setTimeout(() => setIsBirthday(false), 15000)
  }

  const speak = (text: string, attempts = 0) => {
    const synth = window.speechSynthesis
    if (!synth) return

    try { synth.resume() } catch { }

    const doSpeak = () => {
      // If the message includes a non-spoken section, only read the part before it
      const beforeNoSpeak = text.split('[no-speak]')[0]?.trim() || text
      const speakable = sanitizeForSpeech(beforeNoSpeak || 'I have posted the details below.')
      const utter = new SpeechSynthesisUtterance(speakable)
      utter.voice = preferredVoiceRef.current || null
      utter.rate = voiceSettings.rate
      utter.pitch = voiceSettings.pitch
      utter.volume = voiceSettings.volume
      utter.lang = (preferredVoiceRef.current?.lang as string) || navigator.language || 'en-US'

      // Pause recognition while speaking to prevent self-hearing
      try { recognitionRef.current?.stop() } catch { }
      setListening(false)
      setSpeaking(true)

      utter.onstart = () => {
        setSpeaking(true)
      }
      utter.onend = () => {
        setSpeaking(false)
        // Auto-resume listening if it was requested after last final
        if (wantAutoResumeRef.current) {
          wantAutoResumeRef.current = false
          setTimeout(() => startListening(), 200)
        }
      }

      try { synth.cancel() } catch { }
      synth.speak(utter)
    }

    const voices = synth.getVoices?.() || []
    if (voices.length === 0 && attempts < 5) {
      setTimeout(() => speak(text, attempts + 1), 300)
      return
    }

    doSpeak()
  }

  const handleUserUtterance = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setMessages(m => [...m, { role: 'you', text: trimmed }])
    setSessionStats(prev => ({ ...prev, commands: prev.commands + 1 }))
    setIsTyping(true)
    playSound('chime')

    setTimeout(async () => {
      const reply = await generateReply(trimmed)
      setMessages(m => [...m, { role: 'jarvis', text: reply }])
      speak(reply)
      setIsTyping(false)
      if (isMinimized) setUnreadCount(prev => prev + 1)
    }, 500)
  }

  const generateReply = async (text: string): Promise<string> => {
    const lower = text.toLowerCase().trim()

    // Calculator mode: detect mathy input or explicit calculate commands
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
      const url = buildYouTubeSearchUrl(q)
      try { window.open(url, '_blank', 'noopener,noreferrer') } catch { /* ignore */ }
      return `Searching YouTube for "${q}".`
    }

    // Time & Date
    {
      const intent = detectTimeDateIntent(text)
      if (intent) return getTimeDateResponse(intent)
    }

    // Currency Conversion
    {
      const conv = await getCurrencyConversionResponse(text)
      if (conv) return conv
    }

    // Dictionary / Definitions
    if (/^(what\s+does\s+.+\s+mean\??|define\s+.+|(?:the\s+)?definition\s+of\s+.+|(?:the\s+)?meaning\s+of\s+.+)$/i.test(text.trim())) {
      return await getDefinitionResponse(text)
    }

    // News: list headlines (country-aware, no external open)
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

    // Birthday triggers
    if (/(happy birthday|birthday|celebrate)/.test(lower) && !birthdayTriggered) {
      const now = new Date()
      if (now.getMonth() === 7 && now.getDate() === 22) {
        triggerBirthdayMode()
        return "Thank you for the birthday wishes! Let me celebrate properly! 🎉"
      }
      return "Thank you! Though it's not my birthday today, I appreciate the sentiment! 😊"
    }

    // Enhanced greetings with personality
    if (/(^|\b)(hello|hi|hey|yo|good morning|good afternoon|good evening)(\b|[!,. ])/i.test(lower)) {
      const hour = new Date().getHours()
      let greeting = "Hello"

      if (/(good morning|morning)/i.test(lower) || (hour >= 5 && hour < 12)) {
        greeting = "Good morning"
      } else if (/(good afternoon|afternoon)/i.test(lower) || (hour >= 12 && hour < 17)) {
        greeting = "Good afternoon"
      } else if (/(good evening|evening)/i.test(lower) || (hour >= 17 && hour < 22)) {
        greeting = "Good evening"
      } else if (hour >= 22 || hour < 5) {
        greeting = "Working late tonight, I see. Hello"
      }

      const now = new Date()
      if (now.getMonth() === 7 && now.getDate() === 22 && !birthdayTriggered) {
        triggerBirthdayMode()
        return `${greeting}, Boss! Wait... isn't today special? Happy Birthday! 🎂🎉`
      }

      return `${greeting}, Boss! Ready to conquer the day?`
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

    // Google Search (return a single best insight)
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

    // Wikipedia lookup (who/what/wikipedia/tell me about)
    if (/(^|\b)(wikipedia|who\s+(is|was)|what\s+is|tell\s+me\s+about)(\b|\s)/i.test(lower)) {
      const summary = await getWikiSummary(text)
      return summary
    }

    // Enhanced jokes
    if (/(joke|funny|humor|laugh)/.test(lower)) {
      const joke = JOKES[Math.floor(Math.random() * JOKES.length)]
      return `Here's one for you: ${joke} 😄`
    }

    // Weather (real data with fallback)
    if (/(weather|temperature|rain|sunny|cloudy|forecast)/.test(lower)) {
      try {
        const response = await getWeatherResponse(text)
        return response
      } catch {
        const response = WEATHER_RESPONSES[Math.floor(Math.random() * WEATHER_RESPONSES.length)]
        return response
      }
    }

    // Enhanced identity responses
    if (/(who are you|what are you|introduce yourself)/.test(lower)) {
      return "I'm JARVIS - your advanced AI voice assistant. I'm here to help you stay productive, motivated, and entertained. Think of me as your digital companion! 🤖"
    }

    if (/(who is your boss|who's your boss|who do you serve)/.test(lower)) {
      return "You are, Qudus! You're the boss, the chief, the commander-in-chief! I'm at your service. 👑"
    }

    // System info
    if (/(stats|statistics|session|how long)/.test(lower)) {
      const uptime = Math.round((Date.now() - sessionStats.startTime) / 60000)
      return `Session stats: ${sessionStats.commands} commands processed in ${uptime} minutes. We're on fire! 🔥`
    }

    // Enhanced time responses
    if (/(time|what time|current time)/.test(lower)) {
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const period = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'
      return `It's ${timeStr} this ${period}. Time flies when you're being productive! ⏰`
    }

    // Enhanced date responses  
    if (/(date|what day|today)/.test(lower)) {
      const now = new Date()
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      return `Today is ${dateStr}. Make it count! 📅`
    }

    // Enhanced link opening with more services
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

      const urlMap = {
        youtube: 'https://youtube.com',
        'you tube': 'https://youtube.com',
        google: 'https://google.com',
        github: 'https://github.com',
        twitter: 'https://twitter.com',
        x: 'https://x.com',
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        reddit: 'https://reddit.com',
        linkedin: 'https://linkedin.com',
        netflix: 'https://netflix.com',
        gmail: 'https://mail.google.com',
        maps: 'https://maps.google.com',
        'google maps': 'https://maps.google.com',
        docs: 'https://docs.google.com',
        'google docs': 'https://docs.google.com',
        drive: 'https://drive.google.com',
        'google drive': 'https://drive.google.com',
        spotify: 'https://spotify.com',
        discord: 'https://discord.com',
        whatsapp: 'https://web.whatsapp.com',
        telegram: 'https://web.telegram.org',
        amazon: 'https://amazon.com',
        ebay: 'https://ebay.com',
        stackoverflow: 'https://stackoverflow.com',
        'stack overflow': 'https://stackoverflow.com'
      }

      const url = (urlMap as Record<string, string>)[target]
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

    return `You said: "${text}" - I heard you loud and clear! Try asking for the time, motivation, or tell me to open a website! 🎯`
  }

  const startListening = () => {
    setError(null)
    setInterim('')
    try {
      // If currently speaking, wait until TTS ends
      if (speaking) {
        wantAutoResumeRef.current = true
        return
      }
      recognitionRef.current?.start()
      setListening(true)
    } catch {
      setListening(true)
    }
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  type ThemeName = 'cyber' | 'minimal' | 'matrix'
  type ThemeConfig = { bg: string; primary: string; accent: string; card: string; glow: string }
  const themes: Record<ThemeName, ThemeConfig> = {
    cyber: {
      bg: 'from-slate-900 via-purple-900 to-slate-900',
      primary: 'from-purple-500 to-pink-500',
      accent: 'purple-400',
      card: 'bg-black/40 border-purple-500/20',
      glow: 'shadow-purple-500/20'
    },
    minimal: {
      bg: 'from-gray-50 to-white',
      primary: 'from-blue-500 to-cyan-500',
      accent: 'blue-500',
      card: 'bg-white/80 border-gray-200',
      glow: 'shadow-blue-500/20'
    },
    matrix: {
      bg: 'from-black via-green-950 to-black',
      primary: 'from-green-400 to-emerald-400',
      accent: 'green-400',
      card: 'bg-black/60 border-green-500/30',
      glow: 'shadow-green-500/30'
    }
  }

  const currentTheme = themes[theme]

  if (isMinimized) {
    return (
      <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50">
        <button
          onClick={() => {
            setIsMinimized(false)
            setUnreadCount(0)
          }}
          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br ${currentTheme.primary} ${currentTheme.glow} shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center`}
        >
          <span className="text-white font-bold text-lg sm:text-xl">J</span>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
        </button>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} text-white relative overflow-hidden`}>
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
      <div className="absolute top-0 left-0 w-full h-full noise-bg opacity-40"></div>
      
      {/* Birthday Modal */ }
  {
    showBirthdayModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={() => setShowBirthdayModal(false)}>
        <div className={`relative max-w-md mx-4 p-6 sm:p-8 ${currentTheme.card} backdrop-blur-xl rounded-3xl border ${currentTheme.glow} shadow-2xl text-center`} onClick={(e) => e.stopPropagation()}>
          <button
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
            onClick={() => setShowBirthdayModal(false)}
          >
            ✕
          </button>
          <div className="text-6xl mb-4">🎉</div>
          <h2 className={`text-3xl font-bold bg-gradient-to-r ${currentTheme.primary} bg-clip-text text-transparent mb-4`}>
            HAPPY BIRTHDAY!
          </h2>
          <p className="text-lg mb-6 text-gray-300">
            Boss, today is YOUR day! Another year of being absolutely amazing! 🎂
          </p>
          <button
            onClick={() => { setShowBirthdayModal(false); if (!birthdaySpoken) { speak(BIRTHDAY_MESSAGE); setBirthdaySpoken(true) } }}
            className={`px-6 py-3 bg-gradient-to-r ${currentTheme.primary} rounded-xl font-semibold hover:scale-105 transition-transform`}
          >
            Let's Celebrate! 🚀
          </button>
        </div>
      </div>
    )
  }

  {/* Birthday Confetti */ }
  {
    isBirthday && (
      <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
        {confetti.map((c, i) => (
          <div
            key={i}
            className={`absolute animate-bounce`}
            style={{
              left: `${c.left}%`,
              top: '-10px',
              width: `${c.size}px`,
              height: `${c.size}px`,
              backgroundColor: c.color,
              borderRadius: c.shape === 'circle' ? '50%' : '4px',
              transform: `rotate(${c.rotation}deg)`,
              animation: `confetti-fall ${c.duration}s linear ${c.delay}s forwards`,
              opacity: 0.9
            }}
          />
        ))}
      </div>
    )
  }

  {/* Header */ }
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-start">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${currentTheme.primary} rounded-xl opacity-80 animate-pulse blur-sm`}></div>
                <div className={`relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${currentTheme.primary} rounded-xl flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg sm:text-xl">J</span>
                </div>
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${currentTheme.primary} bg-clip-text text-transparent`}>
                  JARVIS
                </h1>
                <p className="text-xs text-gray-400">Your AI Companion</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Conversation Panel */}
          <div className="lg:col-span-2">
            <div className={`${currentTheme.card} backdrop-blur-xl rounded-2xl border ${currentTheme.glow} shadow-2xl overflow-hidden`}>
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className={`text-base sm:text-lg font-semibold text-${currentTheme.accent}`}>Conversation</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => { setTranscript(''); setInterim(''); setMessages([]); }}
                    className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Clear
                  </button>
                  <div className={`text-xs text-${currentTheme.accent} px-2 py-1 rounded bg-white/10`}>
                    {messages.length} messages
                  </div>
                </div>
              </div>

              <div className="h-[60vh] sm:h-[70vh] lg:h-96 overflow-y-auto p-4 sm:p-6 pb-28 bg-gradient-to-b from-black/20 to-transparent">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500">
                    <div className={`mb-6 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center relative`}>
                      <span className="text-xl sm:text-2xl">🎤</span>
                      <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
                    </div>
                    <p className="text-center text-base sm:text-lg mb-2">Ready for your commands, Boss!</p>
                    <p className="text-xs sm:text-sm text-gray-600">Try: "Hello Jarvis", "What time is it?", or "Motivate me"</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((m, i) => {
                      const isYou = m.role === 'you'
                      const isBirthday = m.special === 'birthday'
                      return (
                        <div key={i} className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl p-4 ${
                            isBirthday 
                              ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border-2 border-pink-400/50' 
                              : isYou 
                                ? 'bg-gradient-to-br from-blue-600/40 to-purple-600/40 border border-blue-500/30' 
                                : `bg-gradient-to-br from-${currentTheme.accent}/20 to-${currentTheme.accent}/10 border border-${currentTheme.accent}/30`
                          } backdrop-blur-sm ${currentTheme.glow} shadow-lg`}>
                            <div className="flex items-center mb-2">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                isBirthday ? 'bg-pink-400' : isYou ? 'bg-blue-400' : `bg-${currentTheme.accent}`
                              }`}></div>
                              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                                {isYou ? 'You' : 'JARVIS'}
                              </span>
                              <span className="ml-auto text-xs text-gray-500">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={`text-sm leading-relaxed ${isBirthday ? 'font-semibold' : ''}`}>
                              {m.text}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className={`max-w-[85%] rounded-2xl p-4 bg-gradient-to-br from-${currentTheme.accent}/20 to-${currentTheme.accent}/10 border border-${currentTheme.accent}/30 backdrop-blur-sm`}>
                          <div className="flex items-center mb-2">
                            <div className={`w-2 h-2 rounded-full mr-2 bg-${currentTheme.accent} animate-pulse`}></div>
                            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">JARVIS</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`w-2 h-2 bg-${currentTheme.accent} rounded-full animate-bounce`}></span>
                            <span className={`w-2 h-2 bg-${currentTheme.accent} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></span>
                            <span className={`w-2 h-2 bg-${currentTheme.accent} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Voice Controls */}
            <div className={`${currentTheme.card} backdrop-blur-xl rounded-2xl border ${currentTheme.glow} shadow-2xl p-6`}>
              <h3 className={`text-lg font-semibold text-${currentTheme.accent} mb-4`}>Voice Control</h3>
              
              {!supported ? (
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-center">
                  <p className="text-red-300 text-sm">Speech recognition not supported</p>
                  <p className="text-xs text-red-400 mt-1">Try Chrome or Edge</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    {!listening ? (
                      <button
                        onClick={startListening}
                        className={`relative group w-20 h-20 rounded-full bg-gradient-to-br ${currentTheme.primary} hover:scale-105 transition-all duration-300 ${currentTheme.glow} shadow-2xl flex items-center justify-center`}
                      >
                        <div className="absolute inset-0 rounded-full bg-white/20 group-hover:bg-white/30 animate-ping"></div>
                        <svg className="w-8 h-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={stopListening}
                        className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 hover:scale-105 transition-all duration-300 shadow-2xl shadow-red-500/30 flex items-center justify-center"
                      >
                        <div className="absolute inset-0 rounded-full bg-red-400/30 animate-ping"></div>
                        <div className="w-6 h-6 bg-white rounded-sm relative z-10"></div>
                      </button>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <p className={`text-sm mb-2 ${listening ? `text-${currentTheme.accent}` : 'text-gray-400'}`}>
                      {listening ? (
                        <span className="flex items-center justify-center">
                          Listening...
                          <span className="flex ml-2">
                            <span className={`h-1 w-1 bg-${currentTheme.accent} rounded-full animate-pulse mx-0.5`}></span>
                            <span className={`h-1 w-1 bg-${currentTheme.accent} rounded-full animate-pulse mx-0.5`} style={{ animationDelay: '0.2s' }}></span>
                            <span className={`h-1 w-1 bg-${currentTheme.accent} rounded-full animate-pulse mx-0.5`} style={{ animationDelay: '0.4s' }}></span>
                          </span>
                        </span>
                      ) : 'Ready to listen'}
                    </p>
                    {error && <p className="text-xs text-red-400 mt-1">Error: {error}</p>}
                  </div>

                  {/* Live Transcription */}
                  <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                    <div className={`text-xs text-${currentTheme.accent} uppercase tracking-wider mb-2 font-semibold`}>
                      Live Transcription
                    </div>
                    <div className="min-h-12 p-3 bg-black/40 rounded-lg border border-white/5">
                      {transcript || interim ? (
                        <>
                          {transcript && <span className="text-white">{transcript}</span>}
                          {interim && <span className="text-gray-400 italic"> {interim}</span>}
                        </>
                      ) : (
                        <span className="text-gray-600">Your words appear here...</span>
                      )}
                    </div>
                  </div>

                  {/* Manual Input */}
                  {!listening && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (manualText.trim()) {
                          handleUserUtterance(manualText)
                          setManualText('')
                        }
                      }}
                      className="space-y-2"
                    >
                      <input
                        type="text"
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full rounded-xl bg-black/40 border border-white/20 px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!manualText.trim()}
                        className={`w-full px-4 py-2 rounded-xl bg-gradient-to-r ${currentTheme.primary} text-white font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100`}
                      >
                        Send Message
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Voice Settings */}
            <div className={`${currentTheme.card} backdrop-blur-xl rounded-2xl border ${currentTheme.glow} shadow-2xl p-6`}>
              <h3 className={`text-lg font-semibold text-${currentTheme.accent} mb-4`}>Voice Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Speech Rate</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSettings.rate}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">{voiceSettings.rate}x</div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Pitch</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSettings.pitch}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">{voiceSettings.pitch}x</div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceSettings.volume}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">{Math.round(voiceSettings.volume * 100)}%</div>
                </div>
                <button
                  onClick={() => speak("Voice settings test. How do I sound now, Boss?")}
                  className={`w-full px-4 py-2 rounded-xl bg-gradient-to-r ${currentTheme.primary} text-white text-sm font-semibold hover:scale-105 transition-transform`}
                >
                  Test Voice
                </button>
              </div>
            </div>

            {/* Quick Commands */}
            <div className={`${currentTheme.card} backdrop-blur-xl rounded-2xl border ${currentTheme.glow} shadow-2xl p-6`}>
              <h3 className={`text-lg font-semibold text-${currentTheme.accent} mb-4`}>Quick Commands</h3>
              <div className="space-y-2">
                {[
                  'Hello Jarvis',
                  'What time is it?',
                  'Motivate me',
                  'Tell me a joke',
                  'Open YouTube',
                  'Productivity tip'
                ].map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => handleUserUtterance(cmd)}
                    className="w-full text-left px-3 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 hover:border-white/20"
                  >
                    "{cmd}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Easter Egg Trigger (Aug 22 test) */}
        {currentTime.getMonth() === 7 && currentTime.getDate() === 22 && !birthdayTriggered && (
          <div className="fixed bottom-6 left-6 z-30">
            <button
              onClick={() => triggerBirthdayMode()}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg hover:scale-105 transition-transform animate-bounce"
            >
              🎂 It's Your Birthday!
            </button>
          </div>
        )}
      </div>

  {/* Mobile sticky composer */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-black/70 backdrop-blur-md border-t border-white/10 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,0)+12px)]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const value = manualText.trim()
            if (!value) return
            handleUserUtterance(value)
            setManualText('')
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => (listening ? stopListening() : startListening())}
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${listening ? 'bg-red-600' : 'bg-gradient-to-br'} ${!listening ? currentTheme.primary : ''} shadow-lg`}
            aria-label={listening ? 'Stop listening' : 'Start listening'}
          >
            {listening ? (
              <div className="w-3 h-3 bg-white rounded-sm" />
            ) : (
              <span className="text-white text-xl">🎤</span>
            )}
          </button>
          <input
            type="text"
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder={listening ? 'Listening…' : 'Type your message'}
            className="flex-1 rounded-xl bg-black/50 border border-white/20 px-4 py-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
            disabled={speaking}
          />
          <button
            type="submit"
            disabled={!manualText.trim()}
            className={`shrink-0 px-4 py-3 rounded-xl bg-gradient-to-r ${currentTheme.primary} text-sm font-semibold disabled:opacity-50`}
          >
            Send
          </button>
        </form>
      </div>

  {/* Footer */ }
      <footer className="mt-12 py-6 text-center text-xs text-gray-500 border-t border-white/10">
        <p className="mb-2">JARVIS Enhanced AI Assistant • Powered by Advanced Voice Recognition</p>
        <p>Built with React, Web Speech API & Modern UI/UX • Your Digital Companion</p>
      </footer>

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div >
  )
}

export default App