'use client'

import React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'

const STARTER_PROMPTS = [
  {
    title: 'Marx on Alienation',
    query: "Explain Karl Marx's theory of alienation in capitalist production and labor.",
  },
  {
    title: "Durkheim's Anomie",
    query: 'How does Emile Durkheim define anomie in The Division of Labour and Suicide?',
  },
  {
    title: 'Weber & The Iron Cage',
    query: "What is Max Weber's concept of rationalization and the bureaucratic iron cage?",
  },
  {
    title: 'Social Stratification',
    query: 'Compare functionalist vs conflict theories regarding social stratification and mobility.',
  },
]

export function ChatWelcome({ onSelectPrompt }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 sm:py-16 px-4 max-w-xl mx-auto my-auto animate-in fade-in duration-200">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-100 font-semibold text-sm mb-4">
        SP
      </div>

      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100 mb-2">
        What would you like to explore in sociology?
      </h2>

      <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
        Ask any question about classical sociology, structural paradigms, cultural theories, or research methods.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
        {STARTER_PROMPTS.map((item, index) => (
          <Card
            key={index}
            onClick={() => onSelectPrompt(item.query)}
            className="p-3.5 border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all cursor-pointer group rounded-xl"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors">
                {item.title}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </div>
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {item.query}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
