'use client'

import React, { useRef, useEffect, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessageItem } from './chat-message-item'
import { ChatLoading } from './chat-loading'
import { ChatWelcome } from './chat-welcome'

export function ChatMessageList({
  messages,
  isLoading,
  onSpeak,
  speakingMessageId,
  onSelectStarterPrompt,
}) {
  const scrollRef = useRef(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      })
    }
  }

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollBottom(!isAtBottom)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const hasUserMessages = messages.some((m) => m.role === 'user')

  return (
    <div className="relative flex-1 overflow-hidden">
      <ScrollArea
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full px-4 sm:px-8 py-6 space-y-5"
      >
        <div className="max-w-2xl mx-auto space-y-5">
          {!hasUserMessages ? (
            <ChatWelcome onSelectPrompt={onSelectStarterPrompt} />
          ) : (
            messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                onSpeak={onSpeak}
                isSpeaking={speakingMessageId === message.id}
              />
            ))
          )}

          {isLoading && <ChatLoading />}
        </div>
      </ScrollArea>

      {showScrollBottom && (
        <div className="absolute bottom-4 right-6 sm:right-10 z-20">
          <Button
            size="iconSm"
            variant="secondary"
            onClick={() => scrollToBottom(true)}
            className="rounded-full shadow-lg border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 h-7 w-7"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
