import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const [supported, setSupported] = useState<boolean>(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

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
          setTranscript((prev) => (prev + ' ' + finalText).trim())
          setInterim('')
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
              <button onClick={() => { setTranscript(''); setInterim(''); }} title="Clear transcript">
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
    </main>
  )
}

export default App
