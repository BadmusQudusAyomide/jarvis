import { useEffect, useRef, useState } from 'react'

// Personality pack: motivational quotes and jokes
const MOTIVATIONAL_QUOTES: string[] = [
  "Believe you can and you're halfway there.",
  "Small steps every day lead to big results.",
  "Focus, commit, and execute.",
  "Your future is created by what you do today, not tomorrow.",
  "Discipline beats motivation. Start now.",
  "Make it happen. Shock everyone.",
  "Progress over perfection.",
  "Dream big. Start small. Act now.",
]

const JOKES: string[] = [
  "Why did the developer go broke? Because they used up all their cache.",
  "I told my computer I needed a break, and it said: 'No problem, I'll go to sleep.'",
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "There are only 10 types of people in the world: those who understand binary and those who don't.",
  "Debugging: being the detective in a crime movie where you are also the murderer.",
  "I would tell you a UDP joke, but you might not get it.",
]

// Fun Easter eggs: key phrase -> witty response (string or generator)
const EASTER_EGGS: Record<string, string | (() => string)> = {
  'open the pod bay doors': "I'm sorry, Dave. I'm afraid I can't do that.",
  'are you alive': "I live in the cloud, rent-free.",
  'sing a song': 'La la la... Okay, I will spare your ears, Boss.',
  'flip a coin': () => (Math.random() < 0.5 ? 'Heads!' : 'Tails!'),
  'roll a dice': () => `You rolled a ${1 + Math.floor(Math.random() * 6)}!`,
}

function App() {
  const [supported, setSupported] = useState<boolean>(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [messages, setMessages] = useState<Array<{ role: 'you' | 'jarvis'; text: string }>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [manualText, setManualText] = useState('')
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isBirthday, setIsBirthday] = useState(false)
  const [confetti, setConfetti] = useState<Array<{ left: number; delay: number; duration: number; color: string; size: number }>>([])
  const [birthdayGreeting, setBirthdayGreeting] = useState<string | null>(null)
  const birthdaySpokenRef = useRef(false)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const SR: typeof window.SpeechRecognition | undefined =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      setSupported(true)
      const recog = new SR()
      recog.lang = navigator.language || 'en-US'
      recog.continuous = true
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
          const clean = finalText.trim()
          setTranscript((prev) => (prev + ' ' + clean).trim())
          setInterim('')
          if (clean) handleUserUtterance(clean)
        } else {
          setInterim(interimText)
        }
      }

      recog.onerror = (e: any) => {
        setError(e?.error || 'speech_error')
        setListening(false)
      }

      recog.onend = () => {
        setListening(false)
      }

      recognitionRef.current = recog
    }
  }, [])

  // Load voices for SpeechSynthesis and choose a preferred one
  useEffect(() => {
    const synth = window.speechSynthesis
    if (!synth) return
    const load = () => {
      const v = synth.getVoices()
      // Try to pick a pleasant English voice
      const preferred =
        v.find((vv) => /en-US/i.test(vv.lang) && /female|zira|samantha|google us english/i.test(vv.name)) ||
        v.find((vv) => /en/i.test(vv.lang)) ||
        v[0] || null
      preferredVoiceRef.current = preferred
    }
    load()
    synth.onvoiceschanged = load
    return () => {
      synth.onvoiceschanged = null as any
    }
  }, [])

  // Play a quick celebratory chime
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = 659.25 // E5
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
      o.connect(g)
      g.connect(ctx.destination)
      o.start()
      o.stop(ctx.currentTime + 0.65)
    } catch {}
  }

  // Birthday Mode: previously auto on date; now disabled (we trigger on greeting)
  useEffect(() => {
    const now = new Date()
    if (now.getMonth() === 7 && now.getDate() === 22 && false) {
      setIsBirthday(true)
      // Generate confetti pieces once
      const colors = ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#14b8a6']
      const pieces = Array.from({ length: 80 }).map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.8,
        duration: 3 + Math.random() * 3.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.floor(Math.random() * 8),
      }))
      setConfetti(pieces)

      const greeting = "Happy Birthday, Boss! You're unstoppable today 🚀."
      setBirthdayGreeting(greeting)
      setIsTyping(true)
      setTimeout(() => {
        setMessages((m) => [...m, { role: 'jarvis', text: greeting }])
        speak(greeting)
        birthdaySpokenRef.current = true
        setIsTyping(false)
        playChime()
      }, 400)

      // Auto-stop confetti after a few seconds
      const t = setTimeout(() => setIsBirthday(false), 9000)

      // Fallback: if speech blocked, speak on first user interaction
      const tryOnInteraction = () => {
        if (!birthdaySpokenRef.current && birthdayGreeting) {
          speak(birthdayGreeting)
          birthdaySpokenRef.current = true
        }
        window.removeEventListener('pointerdown', tryOnInteraction)
        window.removeEventListener('keydown', tryOnInteraction)
      }
      // Give a moment for auto-speak; then arm listeners
      const arm = setTimeout(() => {
        window.addEventListener('pointerdown', tryOnInteraction, { once: true })
        window.addEventListener('keydown', tryOnInteraction, { once: true })
      }, 800)

      return () => clearTimeout(t)
    }
  }, [])

  // Helper to show confetti and play chime on demand
  const triggerBirthdayFX = () => {
    setIsBirthday(true)
    const colors = ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#14b8a6']
    const pieces = Array.from({ length: 80 }).map(() => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.8,
      duration: 3 + Math.random() * 3.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.floor(Math.random() * 8),
    }))
    setConfetti(pieces)
    playChime()
    setTimeout(() => setIsBirthday(false), 9000)
  }

  // More robust speech: resume if paused and retry while voices load
  const speak = (text: string, attempts = 0) => {
    const synth = window.speechSynthesis
    if (!synth) return

    try { synth.resume?.() } catch {}

    const doSpeak = () => {
      const utter = new SpeechSynthesisUtterance(text)
      utter.voice = preferredVoiceRef.current || null
      utter.rate = 1
      utter.pitch = 1
      utter.lang = (preferredVoiceRef.current?.lang as string) || navigator.language || 'en-US'
      try { synth.cancel() } catch {}
      synth.speak(utter)
    }

    // If voices not ready yet, retry shortly (max 5 attempts)
    const voices = synth.getVoices?.() || []
    if (voices.length === 0 && attempts < 5) {
      setTimeout(() => speak(text, attempts + 1), 250)
      return
    }

    doSpeak()
  }

  const handleUserUtterance = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((m) => [...m, { role: 'you', text: trimmed }])
    setIsTyping(true)
    // small delay to show typing indicator consistently
    setTimeout(() => {
      const reply = generateReply(trimmed)
      setMessages((m) => [...m, { role: 'jarvis', text: reply }])
      speak(reply)
      setIsTyping(false)
    }, 450)
  }

  const generateReply = (text: string): string => {
    const lower = text.toLowerCase().trim()

    // Personality: Motivation
    if (/(^|\b)(motivate me|motivation|inspire me)(\b|[!,. ])/.test(lower)) {
      const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
      return quote
    }

    // Personality: Jokes
    if (/(^|\b)(tell me a joke|joke)(\b|[!,. ])/.test(lower)) {
      const joke = JOKES[Math.floor(Math.random() * JOKES.length)]
      return joke
    }

    // Introduce yourself
    if (/(jarvis,?\s*)?(introduce yourself|who are you|what are you)/.test(lower)) {
      return "I'm Jarvis, your voice assistant. I listen, respond, and help you get things done."
    }

    // Who is your boss
    if (/(jarvis,?\s*)?(who is your boss|who's your boss|who is your owner)/.test(lower)) {
      return 'You, Qudus. Always you.'
    }

    // Easter eggs (hidden)
    for (const key of Object.keys(EASTER_EGGS)) {
      if (lower.includes(key)) {
        const val = EASTER_EGGS[key]
        return typeof val === 'function' ? (val as () => string)() : val
      }
    }

    // Open links: "Open YouTube", "Open GitHub", etc.
    const openMatch = lower.match(/^open\s+(?:the\s+)?([\w\- ]+)$/)
    if (openMatch) {
      const target = openMatch[1].trim()
      const urlMap: Record<string, string> = {
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
        spotify: 'https://spotify.com',
      }

      const key = target as keyof typeof urlMap
      const url = urlMap[key]
      if (url) {
        try {
          window.open(url, '_blank', 'noopener,noreferrer')
          const pretty = key
            .toString()
            .replace(/\b\w/g, (c) => c.toUpperCase())
          return `Opening ${pretty}.`
        } catch {
          return `I couldn't open ${target} in your browser.`
        }
      }
      return `I don't recognize "${target}". Try YouTube, Google, GitHub, Maps, Gmail, etc.`
    }

    // Greetings
    if (/(^|\b)(hello|hi|hey|yo)(\b|[!,. ])|good (morning|afternoon|evening)/.test(lower)) {
      const now = new Date()
      // If it's Aug 22, add birthday line and trigger FX
      if (now.getMonth() === 7 && now.getDate() === 22) {
        triggerBirthdayFX()
        return "Hello Boss. Oh, I almost forgot—happy birthday, Boss! 🎂🚀"
      }
      return 'Hello Boss.'
    }

    // Time
    if (/(what(?:'| i)?s the time|current time|tell me the time|time is it)/.test(lower)) {
      const now = new Date()
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return `It is ${time}.`
    }

    // Date
    if (/(what(?:'| i)?s the date|today'?s date|what day is it)/.test(lower)) {
      const now = new Date()
      const date = now.toLocaleDateString()
      return `Today is ${date}.`
    }

    // Fallback echo
    return `You said: "${text}"`
  }

  const startListening = () => {
    setError(null)
    setInterim('')
    try {
      recognitionRef.current?.start()
      setListening(true)
    } catch (e) {
      // start can throw if already started; ignore gracefully
      setListening(true)
    }
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Birthday confetti overlay */}
      {isBirthday && (
        <div className="fixed inset-0 overflow-hidden z-20">
          {/* Manual replay button in case autoplay is blocked */}
          {birthdayGreeting && (
            <div className="pointer-events-auto absolute top-3 right-3">
              <button
                onClick={() => {
                  speak(birthdayGreeting)
                  birthdaySpokenRef.current = true
                }}
                className="px-3 py-1.5 text-xs rounded-md bg-pink-600 hover:bg-pink-500 text-white shadow"
              >
                Play Birthday Greeting
              </button>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0">
            {confetti.map((c, i) => (
              <span
                key={i}
                style={{
                  position: 'absolute',
                  top: '-10vh',
                  left: `${c.left}%`,
                  width: c.size,
                  height: c.size,
                  backgroundColor: c.color,
                  opacity: 0.95,
                  transform: 'translateY(-10vh)',
                  borderRadius: 2,
                  animation: `confetti-fall ${c.duration}s linear ${c.delay}s forwards`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      {/* Header with glass effect */}
      <header className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur-md border-b border-gray-700/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full opacity-75 animate-pulse"></div>
              <div className="relative w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">J</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              JARVIS
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${listening ? 'text-green-400' : 'text-gray-400'}`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${listening ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm">{listening ? 'Listening' : 'Standby'}</span>
            </div>
            <div className="text-xs text-gray-400">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Status Panel */}
        <div className="mb-6 p-5 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/30 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg text-center">
              <div className="text-cyan-400 text-3xl font-light mb-1">
                {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">Current Time</div>
            </div>

            <div className="p-4 bg-gray-800/50 rounded-lg text-center">
              <div className="text-cyan-400 text-3xl font-light mb-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">{new Date().toLocaleDateString()}</div>
            </div>

            <div className="p-4 bg-gray-800/50 rounded-lg text-center">
              <div className="text-cyan-400 text-3xl font-light mb-1">
                {supported ? 'Online' : 'Offline'}
              </div>
              <div className="text-gray-400 text-xs uppercase tracking-wider">System Status</div>
            </div>
          </div>
        </div>

        {/* Conversation Panel */}
        <div className="mb-6 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/30 shadow-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-700/30 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-cyan-300">Conversation</h2>
            <button
              onClick={() => { setTranscript(''); setInterim(''); setMessages([]); }}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-5 bg-gradient-to-b from-gray-900/50 to-gray-900/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <div className="mb-4 w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-center">Say "Hello Jarvis" or ask about the time or date</p>
                <p className="text-sm mt-2 text-gray-600">Click the microphone button to start</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => {
                  const isYou = m.role === 'you'
                  return (
                    <div key={i} className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 ${isYou ? 'bg-blue-600/30 border border-blue-500/30' : 'bg-cyan-900/30 border border-cyan-700/30'}`}>
                        <div className="flex items-center mb-1.5">
                          <div className={`w-2 h-2 rounded-full mr-2 ${isYou ? 'bg-blue-400' : 'bg-cyan-400'}`}></div>
                          <span className="text-xs font-medium text-gray-300">
                            {isYou ? 'You' : 'JARVIS'}
                          </span>
                        </div>
                        <div className="text-sm">{m.text}</div>
                      </div>
                    </div>
                  )
                })}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl p-4 bg-cyan-900/30 border border-cyan-700/30">
                      <div className="flex items-center mb-1.5">
                        <div className="w-2 h-2 rounded-full mr-2 bg-cyan-400"></div>
                        <span className="text-xs font-medium text-gray-300">JARVIS</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/30 shadow-lg p-5">
          <h2 className="text-lg font-semibold text-cyan-300 mb-4">Voice Controls</h2>

          {!supported ? (
            <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg text-center">
              <p className="text-red-300">SpeechRecognition not supported in this browser.</p>
              <p className="text-sm text-red-400/80 mt-1">Try using Chrome or Edge</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                {!listening ? (
                  <button
                    onClick={startListening}
                    className="relative group flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/30"
                  >
                    <div className="absolute inset-0 rounded-full bg-cyan-400/20 group-hover:bg-cyan-400/30 animate-ping"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={stopListening}
                    className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-600 hover:from-red-400 hover:to-orange-500 transition-all duration-300 shadow-lg hover:shadow-red-500/30"
                  >
                    <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping"></div>
                    <div className="w-6 h-6 bg-white rounded-sm"></div>
                  </button>
                )}
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">
                  Status: {listening ?
                    <span className="text-cyan-400">Listening... <span className="inline-flex"><span className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse ml-1"></span><span className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse ml-1 delay-150"></span><span className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse ml-1 delay-300"></span></span></span> :
                    <span className="text-gray-400">Ready</span>}
                </p>
                {error && (
                  <p className="text-sm text-red-400 mt-1">Error: {error}</p>
                )}
              </div>

              <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Live Transcription</div>
                <div className="min-h-12 p-3 bg-gray-900/30 rounded border border-gray-700/50">
                  {transcript || interim ? (
                    <>
                      {transcript && <span className="text-white">{transcript}</span>}
                      {interim && <span className="text-gray-400"> {interim}</span>}
                    </>
                  ) : (
                    <span className="text-gray-500">Speech will appear here...</span>
                  )}
                </div>
              </div>

              {!listening && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleUserUtterance(manualText)
                    setManualText('')
                  }}
                  className="mt-4 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg bg-gray-900/40 border border-gray-700/50 px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-600/40"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm"
                  >
                    Send
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Command Suggestions */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Try saying:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Hello Jarvis', 'What time is it?', "What's today's date?", 'Motivate me', 'Tell me a joke', 'Jarvis, introduce yourself', 'Jarvis, who is your boss?'].map((cmd, i) => (
              <span key={i} className="px-3 py-1.5 text-xs bg-gray-800/50 text-gray-300 rounded-full border border-gray-700/30">
                "{cmd}"
              </span>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-10 py-5 text-center text-xs text-gray-600 border-t border-gray-800/30">
        <p>JARVIS Voice Assistant • Built with React & Web Speech API</p>
      </footer>
    </div>
  )
}

export default App