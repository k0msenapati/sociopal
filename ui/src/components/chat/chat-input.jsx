'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ArrowUp, Mic, Square, Globe, Loader2 } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { VoiceVisualizer } from './voice-visualizer'
import { cn } from '@/lib/utils'

export function ChatInput({
  onSend,
  isLoading,
  webSearchEnabled,
  onToggleWebSearch,
  isRecording,
  isInitializingSpeech,
  liveTranscript,
  onToggleRecording,
}) {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (liveTranscript) {
      setInput(liveTranscript)
    }
  }, [liveTranscript])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    }
  }, [input])

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if (!input.trim() || isLoading) return

    onSend(input.trim())
    setInput('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="shrink-0 p-3 sm:p-5 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 to-transparent">
      <div className="max-w-2xl mx-auto">
        {isRecording && (
          <div className="mb-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300">
            <div className="flex items-center gap-2 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping shrink-0" />
              <span className="text-zinc-400 font-medium shrink-0">Listening:</span>
              <span className="text-zinc-200 truncate">
                {liveTranscript || 'Speak your question...'}
              </span>
            </div>
            <VoiceVisualizer isRecording={true} />
          </div>
        )}

        <div className="relative rounded-2xl border border-zinc-800/90 bg-zinc-900/60 focus-within:border-zinc-700 focus-within:bg-zinc-900/80 transition-colors duration-150">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening...'
                : isLoading
                ? 'Thinking...'
                : 'Ask a question about sociology...'
            }
            className="w-full resize-none bg-transparent px-4 pt-3 pb-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none custom-scrollbar disabled:opacity-50 min-h-[44px] max-h-40"
          />

          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Tooltip text="Toggle web search fallback">
                <button
                  type="button"
                  onClick={onToggleWebSearch}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                    webSearchEnabled
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                  )}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </Tooltip>

              <Tooltip text={isRecording ? 'Stop recording' : 'Voice input'}>
                <button
                  type="button"
                  disabled={isLoading || isInitializingSpeech}
                  onClick={onToggleRecording}
                  className={cn(
                    'flex items-center justify-center h-6 w-6 rounded-md transition-colors cursor-pointer',
                    isRecording
                      ? 'bg-red-950/60 text-red-400 border border-red-800/60'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                  )}
                >
                  {isInitializingSpeech ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isRecording ? (
                    <Square className="w-2.5 h-2.5 fill-current" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>
              </Tooltip>
            </div>

            <button
              type="button"
              disabled={!input.trim() || isLoading}
              onClick={handleSubmit}
              className={cn(
                'flex items-center justify-center h-7 w-7 rounded-full transition-all cursor-pointer',
                input.trim() && !isLoading
                  ? 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-sm'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center text-[11px] text-zinc-600 px-2 mt-2">
          <span>Press Enter to send, Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  )
}
