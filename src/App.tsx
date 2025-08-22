import { useEffect, useRef, useState } from 'react'

function App() {
  const [supported, setSupported] = useState<boolean>(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [messages, setMessages] = useState<Array<{ role: 'you' | 'jarvis'; text: string }>>([])
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

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
    setMessages((m) => [...m, { role: 'you', text }])
    const reply = generateReply(text)
    setMessages((m) => [...m, { role: 'jarvis', text: reply }])
    speak(reply)
  }

  const generateReply = (text: string): string => {
    const lower = text.toLowerCase()
    // Greetings
    if (/(hello|hi|hey|yo)[!,. ]?|good (morning|afternoon|evening)/.test(lower)) {
      return 'Hello Boss, how are you today?'
    }
    // Time
    if (/what(?:'| i)?s the time|current time|tell me the time/.test(lower)) {
      const now = new Date()
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      return `It is ${time}.`
    }
    // Date
    if (/what(?:'| i)?s the date|today'?s date|what day is it/.test(lower)) {
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
    <main className="mx-auto max-w-2xl p-6">
      {/* Header */}
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Jarvis</h1>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
          <span className="size-2.5 rounded-full bg-emerald-500" /> Online
        </span>
      </header>

      {/* Controls */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl mb-2 font-medium">Voice Input</h2>
        {!supported ? (
          <p className="text-red-600">SpeechRecognition not supported in this browser.</p>
        ) : (
          <div className="grid gap-2">
            <div className="flex gap-2">
              {!listening ? (
                <button onClick={startListening} title="Start listening" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700">
                  <span>🎤</span> <span className="font-medium">Start</span>
                </button>
              ) : (
                <button onClick={stopListening} title="Stop listening" className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-red-700 hover:border-red-400">
                  <span className="relative inline-flex items-center">
                    ⏹️
                    <span className="ml-2 inline-flex items-center gap-1 text-red-600">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                      Listening
                    </span>
                  </span>
                </button>
              )}
              <button onClick={() => { setTranscript(''); setInterim(''); setMessages([]); }} title="Clear transcript" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:border-gray-400">
                <span>🧹</span> <span className="font-medium">Clear</span>
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <span>Status: {listening ? 'Listening…' : 'Idle'}</span>
              {error && <span className="ml-2 text-red-600">Error: {error}</span>}
            </div>
            <div>
              <label className="font-semibold">Transcript:</label>
              <div className="mt-1 min-h-12 rounded-lg border border-gray-300 p-3 text-gray-900 ring-blue-100 focus-within:ring">
                {transcript || <span className="text-gray-400">Say something…</span>}
                {interim && <span className="text-gray-400"> {interim}</span>}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Conversation */}
      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl mb-3 font-medium">Conversation</h2>
        {messages.length === 0 ? (
          <p className="text-gray-600">Try saying “Hello Jarvis” or “What’s the time?”</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m, i) => {
              const isYou = m.role === 'you'
              return (
                <li key={i} className={`flex ${isYou ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isYou
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    <div className="mb-0.5 text-[11px] opacity-80">
                      {isYou ? 'You' : 'Jarvis'}
                    </div>
                    <div>{m.text}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
