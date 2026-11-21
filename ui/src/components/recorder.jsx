'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'

export default function Recorder({ onFinalTranscript, isRecording, setIsRecording }) {
  const socketRef = useRef(null)
  const mediaStream = useRef(null)
  const audioContext = useRef(null)
  const scriptProcessor = useRef(null)
  const [liveText, setLiveText] = useState('')

  useEffect(() => {
    if (isRecording) {
      startRecording()
    } else {
      stopRecording()
    }

    return () => {
      stopRecording()
    }
  }, [isRecording])

  const getToken = async () => {
    try {
      const res = await fetch('/api/token')
      if (!res.ok) return null
      const data = await res.json()
      return data.token
    } catch {
      return null
    }
  }

  const startRecording = async () => {
    const token = await getToken()
    if (!token) {
      alert('Speech-to-text is disabled (ASSEMBLYAI_API_KEY not configured)')
      setIsRecording(false)
      return
    }

    const socket = new WebSocket(
      `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&formatted_finals=true&token=${token}`
    )
    socketRef.current = socket

    const turns = {}

    socket.onopen = async () => {
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioContext.current = new AudioContext({ sampleRate: 16000 })
      const source = audioContext.current.createMediaStreamSource(mediaStream.current)
      scriptProcessor.current = audioContext.current.createScriptProcessor(4096, 1, 1)
      source.connect(scriptProcessor.current)
      scriptProcessor.current.connect(audioContext.current.destination)

      scriptProcessor.current.onaudioprocess = (event) => {
        if (socket.readyState !== WebSocket.OPEN) return
        const input = event.inputBuffer.getChannelData(0)
        const buffer = new Int16Array(input.length)
        for (let i = 0; i < input.length; i++) {
          buffer[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff
        }
        socket.send(buffer.buffer)
      }
    }

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'Turn') {
        const { transcript, turn_order } = msg
        turns[turn_order] = transcript
        const full = Object.keys(turns)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => turns[k])
          .join(' ')

        setLiveText(full)
        if (onFinalTranscript) onFinalTranscript(full)
      }
    }

    socket.onerror = (err) => {
      console.error('WebSocket error:', err)
      setIsRecording(false)
    }

    socket.onclose = () => {
      console.log('Socket closed')
    }
  }

  const stopRecording = () => {
    try {
      if (scriptProcessor.current) {
        scriptProcessor.current.disconnect()
        scriptProcessor.current = null
      }
      if (audioContext.current) {
        audioContext.current.close()
        audioContext.current = null
      }
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => track.stop())
        mediaStream.current = null
      }
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({ type: 'Terminate' }))
        socketRef.current.close()
        socketRef.current = null
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <button
      onClick={() => setIsRecording((prev) => !prev)}
      className={`p-2 rounded transition ${
        isRecording ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-600'
      }`}
    >
      {isRecording ? (
        <>
          <Square className="w-5 h-5" />
        </>
      ) : (
        <>
          <Mic className="w-5 h-5" />
        </>
      )}
    </button>
  )
}
