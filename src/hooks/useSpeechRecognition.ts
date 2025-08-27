import { useEffect, useRef, useState } from 'react'

export const useSpeechRecognition = () => {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const lastFinalAtRef = useRef<number>(0)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      setSupported(true)
      const recog = new SR()
      recog.lang = navigator.language || 'en-US'
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
          const now = Date.now()
          if (now - lastFinalAtRef.current < 600) return
          lastFinalAtRef.current = now
          const clean = finalText.trim()
          setTranscript(prev => (prev + ' ' + clean).trim())
          setInterim('')
          if (clean) {
            try { recognitionRef.current?.stop() } catch { }
            setListening(false)
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

  const startListening = () => {
    setError(null)
    setInterim('')
    try {
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

  return {
    supported,
    listening,
    transcript,
    interim,
    error,
    startListening,
    stopListening,
    setTranscript
  }
}
