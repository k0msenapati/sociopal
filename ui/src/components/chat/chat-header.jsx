'use client'

import React from 'react'
import { Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { VoiceVisualizer } from './voice-visualizer'

export function ChatHeader({
  isVoiceEnabled,
  onToggleVoice,
  onClearChat,
  isSpeaking,
}) {
  return (
    <header className="shrink-0 border-b border-zinc-800/80 px-4 sm:px-6 py-3 flex items-center justify-between bg-[#09090b]/80 backdrop-blur-md z-20">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-800 text-zinc-200 font-semibold text-xs border border-zinc-700/60">
          S
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-medium text-zinc-100 tracking-tight">
            SocioPal
          </h1>
          <span className="text-zinc-600">•</span>
          <span className="text-xs text-zinc-400 font-normal">
            Sociology Assistant
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Tooltip text={isVoiceEnabled ? 'Voice output active' : 'Voice output muted'}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleVoice}
            className="text-xs gap-1.5 px-2.5 h-7 text-zinc-400 hover:text-zinc-200"
          >
            {isVoiceEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-zinc-200" />
                <span className="hidden sm:inline text-xs">Voice</span>
                <VoiceVisualizer isSpeaking={isSpeaking} />
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline text-xs">Muted</span>
              </>
            )}
          </Button>
        </Tooltip>

        <Tooltip text="New chat">
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onClearChat}
            className="text-zinc-400 hover:text-zinc-200 h-7 w-7"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </Tooltip>
      </div>
    </header>
  )
}
