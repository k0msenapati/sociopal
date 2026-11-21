'use client'

import { useState, useCallback } from 'react'
import { querySociologyAgent } from '@/services/api'

const INITIAL_MESSAGES = [
  {
    id: 'msg-init',
    role: 'ai',
    text: "Welcome to SocioPal. I'm your domain-expert AI for sociology. Ask me anything about classical or contemporary theories, social institutions, paradigm shifts, or qualitative/quantitative methodologies.",
    timestamp: new Date().toISOString(),
  },
]

export function useChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)

  const sendMessage = useCallback(
    async (text, customWebSearch) => {
      const trimmed = (text || '').trim()
      if (!trimmed || isLoading) return

      const useWeb = typeof customWebSearch === 'boolean' ? customWebSearch : webSearchEnabled

      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      try {
        const result = await querySociologyAgent(trimmed, useWeb)

        const aiMessage = {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: result.answer,
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, aiMessage])
        return aiMessage
      } catch (err) {
        console.error('[Chat Error]:', err)
        const errorMessage = {
          id: `err-${Date.now()}`,
          role: 'ai',
          text: err.message || 'Something went wrong while processing your question.',
          isError: true,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMessage])
        setError(err.message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, webSearchEnabled]
  )

  const clearMessages = useCallback(() => {
    setMessages(INITIAL_MESSAGES)
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    webSearchEnabled,
    setWebSearchEnabled,
    sendMessage,
    clearMessages,
  }
}
