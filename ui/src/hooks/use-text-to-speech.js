'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { requestElevenLabsTTS } from '@/services/speech'

export function useTextToSpeech({ defaultEnabled = false } = {}) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(defaultEnabled)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentSpeakingId, setCurrentSpeakingId] = useState(null)
  const audioRef = useRef(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch {}
      audioRef.current = null
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
      } catch {}
    }

    setIsSpeaking(false)
    setCurrentSpeakingId(null)
  }, [])

  const speak = useCallback(
    async (text, messageId = null) => {
      if (!text || typeof window === 'undefined') return

      stop()
      setIsSpeaking(true)
      if (messageId) setCurrentSpeakingId(messageId)

      try {
        const audioBlob = await requestElevenLabsTTS(text)
        if (audioBlob) {
          const url = URL.createObjectURL(audioBlob)
          const audio = new Audio(url)
          audioRef.current = audio

          audio.onended = () => {
            setIsSpeaking(false)
            setCurrentSpeakingId(null)
            URL.revokeObjectURL(url)
          }

          audio.onerror = () => {
            setIsSpeaking(false)
            setCurrentSpeakingId(null)
            URL.revokeObjectURL(url)
          }

          await audio.play()
          return
        }
      } catch {}

      if ('speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = 1.0
          utterance.pitch = 1.0

          utterance.onend = () => {
            setIsSpeaking(false)
            setCurrentSpeakingId(null)
          }

          utterance.onerror = () => {
            setIsSpeaking(false)
            setCurrentSpeakingId(null)
          }

          window.speechSynthesis.speak(utterance)
          return
        } catch (e) {
          console.warn('[Web Speech API error]:', e)
        }
      }

      setIsSpeaking(false)
      setCurrentSpeakingId(null)
    },
    [stop]
  )

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled((prev) => {
      const next = !prev
      if (!next) {
        stop()
      }
      return next
    })
  }, [stop])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    isVoiceEnabled,
    isSpeaking,
    currentSpeakingId,
    toggleVoice,
    speak,
    stop,
  }
}
