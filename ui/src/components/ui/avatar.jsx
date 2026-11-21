import React from 'react'
import { cn } from '@/lib/utils'

export function Avatar({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'relative flex h-7 w-7 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 select-none items-center justify-center',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function AvatarFallback({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center font-medium text-xs text-zinc-400',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
