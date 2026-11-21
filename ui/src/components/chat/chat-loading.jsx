import React from 'react'
import { Bot } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function ChatLoading() {
  return (
    <div className="flex items-start gap-3 max-w-2xl animate-in fade-in duration-200">
      <Avatar className="h-7 w-7 mt-0.5 border border-zinc-800 bg-zinc-900">
        <AvatarFallback className="text-zinc-400">
          <Bot className="w-3.5 h-3.5" />
        </AvatarFallback>
      </Avatar>

      <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
      </div>
    </div>
  )
}
