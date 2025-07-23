'use client'

import { useState } from 'react'
import Recorder from './recorder'
import { CornerDownLeft } from 'lucide-react'

export default function InputBar({ onSend }) {
  const [text, setText] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  const handleSubmit = () => {
    if (text.trim()) {
      onSend(text)
      setText('')
    }
  }

  return (
    <div className="border border-gray-800 m-2 px-4 py-4 rounded-2xl">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="ask about sociology..."
        className="w-full bg-[#2a1e53] text-white placeholder-gray-200 rounded-2xl px-4 py-3 mb-3 focus:outline-none focus:border-blue-500 transition-colors"
      />

      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          <Recorder
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            onFinalTranscript={(transcript) => {
              setText(transcript)
              handleSubmit()
            }}
          />
        </div>
        <button
          onClick={handleSubmit}
          className="bg-violet-100 text-black font-medium px-5 py-3 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          Send Message <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
