'use client'

import { useState } from 'react'
import ChatBot from '@/components/chat-bot'
import Welcome from '@/components/welcome'

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! You have any doubts about sociology?' },
  ])

  const handleStart = () => {
    setHasStarted(true)
  }

  const sendToBackend = async (text) => {
    setMessages((prev) => [...prev, { role: 'user', text }])

    const res = await fetch('http://localhost:8000/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text, web_search: false }),
    })

    const data = await res.json()
    const reply = data.answer || 'Sorry, something went wrong.'
    setMessages((prev) => [...prev, { role: 'ai', text: reply }])
  }

  if (typeof window !== 'undefined') {
    window.onTranscriptFinal = (text) => sendToBackend(text)
  }

  return (
    <div className="relative h-screen w-full bg-[#03001C] overflow-hidden flex justify-center items-center">
      {!hasStarted && <Welcome onStart={handleStart} />}

      <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
      <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>

      <ChatBot messages={messages} onSend={sendToBackend} />
    </div>
  )
}
