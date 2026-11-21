import React from 'react'
import { cn } from '@/lib/utils'

export function VoiceVisualizer({ className, isRecording, isSpeaking }) {
  const active = isRecording || isSpeaking

  return (
    <div className={cn('flex items-center gap-0.5 h-3.5 px-0.5', className)}>
      <span
        className={cn(
          'w-0.5 rounded-full bg-zinc-300 transition-all',
          active ? 'animate-wave-1' : 'h-1 opacity-25'
        )}
      />
      <span
        className={cn(
          'w-0.5 rounded-full bg-zinc-300 transition-all',
          active ? 'animate-wave-2' : 'h-1.5 opacity-25'
        )}
      />
      <span
        className={cn(
          'w-0.5 rounded-full bg-zinc-300 transition-all',
          active ? 'animate-wave-3' : 'h-1 opacity-25'
        )}
      />
      <span
        className={cn(
          'w-0.5 rounded-full bg-zinc-300 transition-all',
          active ? 'animate-wave-4' : 'h-1.5 opacity-25'
        )}
      />
    </div>
  )
}
