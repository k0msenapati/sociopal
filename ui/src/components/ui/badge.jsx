import React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = {
  default: 'border-transparent bg-zinc-800 text-zinc-100',
  secondary: 'border-zinc-800 bg-zinc-900/90 text-zinc-400',
  outline: 'border-zinc-800 text-zinc-400',
  success: 'border-emerald-900/40 bg-emerald-950/30 text-emerald-400',
  destructive: 'border-red-900/40 bg-red-950/30 text-red-400',
}

export function Badge({ className, variant = 'default', children, ...props }) {
  const variantClass = badgeVariants[variant] || badgeVariants.default

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
        variantClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
