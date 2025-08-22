import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Trash2, Volume2, Settings, Power } from 'lucide-react'

function App() {
  const [supported, setSupported] = useState<boolean>(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [messages, setMessages] = useState<Array<{ role: 'you' | 'jarvis'; text: string; timestamp: Date }>>([])
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
        setIsProcessing(false)
      }

      recog.onend = () => {
        setListening(false)
        setIsProcessing(false)
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

  const speak = (text: string) => {
    const synth = window.speechSynthesis
    if (!synth) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.voice = preferredVoiceRef.current || null
    utter.rate = 1
    utter.pitch = 1
    utter.lang = (preferredVoiceRef.current?.lang as string) || navigator.language || 'en-US'
    synth.cancel() // stop any previous utterances
    synth.speak(utter)
  }

  const handleUserUtterance = (text: string) => {
    setIsProcessing(true)
    const userMessage = { role: 'you' as const, text, timestamp: new Date() }
    setMessages((m) => [...m, userMessage])

    // Simulate processing delay for more realistic feel
    setTimeout(() => {
      const reply = generateReply(text)
      const jarvisMessage = { role: 'jarvis' as const, text: reply, timestamp: new Date() }
      setMessages((m) => [...m, jarvisMessage])
      speak(reply)
      setIsProcessing(false)
    }, 500)
  }

  const generateReply = (text: string): string => {
    const lower = text.toLowerCase()

    // Enhanced responses with more personality
    if (/(hello|hi|hey|yo)[!,. ]?|good (morning|afternoon|evening)/.test(lower)) {
      const greetings = [
        "Hello Boss, how can I assist you today?",
        "Good to see you again. What do you need?",
        "At your service. How may I help?",
        "Hello there! Ready to get things done?"
      ]
      return greetings[Math.floor(Math.random() * greetings.length)]
    }

    if (/what(?:'| i)?s the time|current time|tell me the time/.test(lower)) {
      const now = new Date()
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return `The current time is ${time}.`
    }

    if (/what(?:'| i)?s the date|today'?s date|what day is it/.test(lower)) {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
      const date = now.toLocaleDateString(undefined, options)
      return `Today is ${date}.`
    }

    if (/weather/.test(lower)) {
      return "I'd need access to weather data to provide that information. Is there something else I can help you with?"
    }

    if (/(thank you|thanks|appreciate)/.test(lower)) {
      return "You're welcome! Anything else I can do for you?"
    }

    if (/(goodbye|bye|see you|exit)/.test(lower)) {
      return "Goodbye! Have a great day!"
    }

    // Enhanced fallback with suggestions
    const suggestions = [
      "Try asking about the time, date, or say hello!",
      "I'm still learning. You can ask about time, date, or just chat with me.",
      "I heard you, but I'm not sure how to respond to that yet. Try asking about the current time!"
    ]
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
    return `You said: "${text}". ${suggestion}`
  }

  const startListening = () => {
    setError(null)
    setInterim('')
    try {
      recognitionRef.current?.start()
      setListening(true)
    } catch (e) {
      setListening(true)
    }
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const clearAll = () => {
    setTranscript('')
    setInterim('')
    setMessages([])
    setError(null)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!supported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-red-400 text-xl font-semibold mb-2">Voice Recognition Not Supported</h2>
          <p className="text-red-300/80">Your browser doesn't support speech recognition. Please try Chrome, Edge, or Safari.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <span className="text-lg font-bold">J</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                JARVIS
              </h1>
              <p className="text-xs text-white/60">Voice Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-300 font-medium">Online</span>
            </div>

            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={clearAll}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 flex flex-col h-[calc(100vh-88px)]">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center">
                    <Volume2 className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white/90 mb-2">Ready to assist</h3>
                  <p className="text-white/60 max-w-md">
                    Press the microphone button and try saying "Hello Jarvis", "What's the time?", or ask me anything!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={index} className={`flex gap-3 ${message.role === 'you' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'jarvis' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold">J</span>
                      </div>
                    )}

                    <div className={`max-w-[80%] ${message.role === 'you' ? 'order-1' : ''}`}>
                      <div className={`rounded-2xl px-4 py-3 ${message.role === 'you'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                          : 'bg-white/10 backdrop-blur border border-white/20 text-white'
                        }`}>
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        <p className={`text-xs mt-1 ${message.role === 'you' ? 'text-white/70' : 'text-white/50'
                          }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>

                    {message.role === 'you' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold">You</span>
                      </div>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold">J</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-white/70">Processing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Voice Input Status */}
          {(listening || interim) && (
            <div className="mb-4 p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-white/90">Listening...</span>
                </div>
                {error && (
                  <span className="text-xs text-red-400">Error: {error}</span>
                )}
              </div>
              {interim && (
                <p className="text-white/70 text-sm italic">"{interim}"</p>
              )}
            </div>
          )}

          {/* Voice Control */}
          <div className="flex items-center justify-center gap-4 py-4">
            <button
              onClick={listening ? stopListening : startListening}
              className={`group relative p-4 rounded-full transition-all duration-300 ${listening
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25'
                }`}
              disabled={isProcessing}
            >
              {listening ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}

              {listening && (
                <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping"></div>
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-white/60">
                {listening ? 'Tap to stop listening' : 'Tap to start voice input'}
              </p>
              {!listening && transcript && (
                <p className="text-xs text-white/40 mt-1">Last heard: "{transcript.slice(-30)}..."</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App