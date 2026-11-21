import React from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = {
  variant: {
    default: 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-sm active:scale-[0.98]',
    secondary: 'bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700/90 border border-zinc-700/50 active:scale-[0.98]',
    outline: 'border border-zinc-800 bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800/60 active:scale-[0.98]',
    ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 active:scale-[0.98]',
    destructive: 'bg-red-900/60 text-red-200 border border-red-800/60 hover:bg-red-800/70 active:scale-[0.98]',
  },
  size: {
    default: 'h-9 px-3.5 py-2 text-sm',
    sm: 'h-8 rounded-lg px-2.5 text-xs',
    lg: 'h-11 rounded-xl px-5 text-sm',
    icon: 'h-8 w-8 rounded-lg p-0 flex items-center justify-center',
    iconSm: 'h-7 w-7 rounded-lg p-0 flex items-center justify-center text-xs',
  },
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  disabled = false,
  children,
  ...props
}) {
  const variantClass = buttonVariants.variant[variant] || buttonVariants.variant.default
  const sizeClass = buttonVariants.size[size] || buttonVariants.size.default

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none',
        variantClass,
        sizeClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
