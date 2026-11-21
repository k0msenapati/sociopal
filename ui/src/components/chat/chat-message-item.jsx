'use client'

import React, { useState } from 'react'
import { Copy, Check, Volume2, Bot, AlertCircle } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function ChatMessageItem({
  message,
  onSpeak,
  isSpeaking,
}) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = () => {
    if (!message.text) return
    navigator.clipboard.writeText(message.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 w-full transition-all duration-150',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-7 w-7 mt-0.5 border border-zinc-800 bg-zinc-900 shrink-0">
          <AvatarFallback className="text-zinc-400">
            <Bot className="w-3.5 h-3.5" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'flex flex-col space-y-1 max-w-[85%] sm:max-w-[78%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-all',
            isUser
              ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm'
              : message.isError
              ? 'bg-red-950/20 border border-red-900/50 text-red-200 rounded-tl-sm'
              : 'bg-zinc-900/50 border border-zinc-800/70 text-zinc-200 rounded-tl-sm'
          )}
        >
          {message.isError && (
            <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium mb-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Connection Error</span>
            </div>
          )}

          <div className="whitespace-pre-wrap break-words">
            {message.text}
          </div>
        </div>

        {!isUser && !message.isError && (
          <div className="flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Tooltip text={copied ? 'Copied' : 'Copy'}>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </Tooltip>

            {onSpeak && (
              <Tooltip text={isSpeaking ? 'Stop speaking' : 'Read aloud'}>
                <button
                  type="button"
                  onClick={() => onSpeak(message.text, message.id)}
                  className={cn(
                    'p-1 rounded transition-colors cursor-pointer',
                    isSpeaking
                      ? 'text-zinc-100 bg-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
