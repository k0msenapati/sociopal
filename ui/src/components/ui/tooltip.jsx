import React, { useState } from 'react'
import { cn } from '@/lib/utils'

export function Tooltip({ text, children, position = 'top', className }) {
  const [visible, setVisible] = useState(false)

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300 shadow-md border border-zinc-800 select-none animate-in fade-in duration-100',
            positions[position] || positions.top,
            className
          )}
        >
          {text}
        </div>
      )}
    </div>
  )
}
