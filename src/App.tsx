import { useEffect, useRef, useState } from 'react'
import './App.css'

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
    <main className="container">
      <h1>Jarvis</h1>
      <section className="card">
        <h2>Voice Input</h2>
        {!supported ? (
          <p style={{ color: 'crimson' }}>
            SpeechRecognition not supported in this browser.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {!listening ? (
                <button onClick={startListening} title="Start listening">
                  🎤 Start
                </button>
              ) : (
                <button onClick={stopListening} title="Stop listening">
                  ⏹️ Stop
                </button>
              )}
              <button onClick={() => { setTranscript(''); setInterim(''); setMessages([]); }} title="Clear transcript">
                🧹 Clear
              </button>
            </div>
            <div>
              <small>Status: {listening ? 'Listening…' : 'Idle'}</small>
              {error && (
                <small style={{ color: 'crimson', marginLeft: 8 }}>
                  Error: {error}
                </small>
              )}
            </div>
            <div>
              <label><strong>Transcript:</strong></label>
              <div style={{ padding: 8, border: '1px solid #555', borderRadius: 6, minHeight: 48 }}>
                {transcript || <span style={{ opacity: 0.6 }}>Say something…</span>}
                {interim && (
                  <span style={{ opacity: 0.6 }}> {interim}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Conversation</h2>
        {messages.length === 0 ? (
          <p style={{ opacity: 0.7 }}>Try saying “Hello Jarvis” or “What’s the time?”</p>
        ) : (
          <ul className="chat">
            {messages.map((m, i) => (
              <li key={i} className={m.role === 'you' ? 'me' : 'jarvis'}>
                <strong>{m.role === 'you' ? 'You' : 'Jarvis'}:</strong> {m.text}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
