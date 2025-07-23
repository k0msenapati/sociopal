'use client'

import { speak } from '@/utils/speak'
import { useRef } from 'react'
import { useEffect } from 'react'
import InputBar from '@/components/input-bar'

export default function ChatBot({ messages, onSend }) {
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last?.role === 'ai') {
      speak(last.text)
    }
  }, [messages])

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="relative z-10 flex flex-col h-[90vh] max-h-[900px] w-full max-w-2xl bg-[#17153B] rounded-lg shadow-lg overflow-hidden">
      <header className="border-b border-gray-800 mx-32 py-4 text-center">
        <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          SocioPal
        </h1>
        <p className="text-sm text-gray-400 mt-1">Ask me anything about sociology!</p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 ${
              msg.role !== 'ai' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg ${
                msg.role !== 'ai' ? 'bg-[#2E236C] text-white' : 'bg-[#433D8B] text-white'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <InputBar onSend={onSend} />
    </main>
  )
}
