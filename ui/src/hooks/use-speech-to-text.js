'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { getAssemblyAIToken } from '@/services/speech'

export function useSpeechToText({ onFinalTranscript } = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [micActive, setMicActive] = useState(false)

  const socketRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const audioContextRef = useRef(null)
  const scriptProcessorRef = useRef(null)
  const webSpeechRef = useRef(null)
  const callbackRef = useRef(onFinalTranscript)

  useEffect(() => {
    callbackRef.current = onFinalTranscript
  }, [onFinalTranscript])

  const stop = useCallback(() => {
    if (webSpeechRef.current) {
      try {
        webSpeechRef.current.stop()
      } catch {}
      webSpeechRef.current = null
    }

    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect()
      } catch {}
      scriptProcessorRef.current = null
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch {}
      audioContextRef.current = null
    }

    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      } catch {}
      mediaStreamRef.current = null
    }

    if (socketRef.current) {
      try {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'Terminate' }))
        }
        socketRef.current.close()
      } catch {}
      socketRef.current = null
    }

    setIsRecording(false)
    setIsInitializing(false)
    setMicActive(false)
  }, [])

  const startWebSpeech = useCallback(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use text input.')
      stop()
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
        setMicActive(true)
        setIsInitializing(false)
      }

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        setLiveTranscript(transcript)

        const isFinal =
          event.results[0]?.isFinal || event.results[event.results.length - 1]?.isFinal
        if (isFinal && transcript.trim()) {
          if (callbackRef.current) {
            callbackRef.current(transcript.trim())
          }
          stop()
        }
      }

      recognition.onerror = (e) => {
        console.warn('Web Speech recognition event:', e.error)
        stop()
      }

      recognition.onend = () => {
        stop()
      }

      webSpeechRef.current = recognition
      recognition.start()
    } catch (e) {
      console.error('Web Speech start error:', e)
      stop()
    }
  }, [stop])

  const startAssemblyAI = useCallback(
    async (token) => {
      const socket = new WebSocket(
        `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&formatted_finals=true&token=${token}`
      )
      socketRef.current = socket
      const turns = {}

      socket.onopen = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          mediaStreamRef.current = stream
          const ctx = new AudioContext({ sampleRate: 16000 })
          audioContextRef.current = ctx

          const source = ctx.createMediaStreamSource(stream)
          const processor = ctx.createScriptProcessor(4096, 1, 1)
          scriptProcessorRef.current = processor

          source.connect(processor)
          processor.connect(ctx.destination)

          processor.onaudioprocess = (event) => {
            if (socket.readyState !== WebSocket.OPEN) return
            const input = event.inputBuffer.getChannelData(0)
            const buffer = new Int16Array(input.length)
            for (let i = 0; i < input.length; i++) {
              buffer[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff
            }
            socket.send(buffer.buffer)
          }

          setIsRecording(true)
          setMicActive(true)
          setIsInitializing(false)
        } catch (err) {
          console.error('Microphone access denied or error:', err)
          stop()
        }
      }

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'Turn') {
            const { transcript, turn_order } = msg
            turns[turn_order] = transcript
            const full = Object.keys(turns)
              .sort((a, b) => Number(a) - Number(b))
              .map((k) => turns[k])
              .join(' ')

            setLiveTranscript(full)
            if (callbackRef.current && full.trim()) {
              callbackRef.current(full.trim())
            }
          }
        } catch (e) {
          console.error(e)
        }
      }

      socket.onerror = (err) => {
        console.error('AssemblyAI WebSocket error:', err)
        stop()
      }

      socket.onclose = () => {
        stop()
      }
    },
    [stop]
  )

  const start = useCallback(async () => {
    setIsInitializing(true)
    setLiveTranscript('')

    try {
      const token = await getAssemblyAIToken()
      if (token) {
        await startAssemblyAI(token)
      } else {
        startWebSpeech()
      }
    } catch {
      startWebSpeech()
    }
  }, [startAssemblyAI, startWebSpeech])

  const toggleRecording = useCallback(() => {
    if (isRecording || isInitializing) {
      stop()
    } else {
      start()
    }
  }, [isRecording, isInitializing, start, stop])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    isRecording,
    isInitializing,
    liveTranscript,
    micActive,
    start,
    stop,
    toggleRecording,
  }
}
