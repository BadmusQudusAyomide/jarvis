import { useEffect, useRef, useState } from 'react'
import type { VoiceSettings } from '../types'

export const useSpeechSynthesis = () => {
  const [speaking, setSpeaking] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({ rate: 1, pitch: 1, volume: 1 })
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

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

  const sanitizeForSpeech = (text: string) => {
    return text
      .replace(/https?:\/\/\S+/gi, 'the link below')
      .replace(/\bLink:\s*/gi, 'link: ')
      .replace(/🔹/g, '- ')
      .replace(/[\u{1F000}-\u{1FAFF}\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}]/gu, '')
  }

  const speak = (text: string, attempts = 0) => {
    const synth = window.speechSynthesis
    if (!synth) return

    try { synth.resume() } catch { }

    const doSpeak = () => {
      const beforeNoSpeak = text.split('[no-speak]')[0]?.trim() || text
      const speakable = sanitizeForSpeech(beforeNoSpeak || 'I have posted the details below.')
      const utter = new SpeechSynthesisUtterance(speakable)
      utter.voice = preferredVoiceRef.current || null
      utter.rate = voiceSettings.rate
      utter.pitch = voiceSettings.pitch
      utter.volume = voiceSettings.volume
      utter.lang = (preferredVoiceRef.current?.lang as string) || navigator.language || 'en-US'

      setSpeaking(true)

      utter.onstart = () => setSpeaking(true)
      utter.onend = () => setSpeaking(false)

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

  return {
    speaking,
    voiceSettings,
    setVoiceSettings,
    speak
  }
}
