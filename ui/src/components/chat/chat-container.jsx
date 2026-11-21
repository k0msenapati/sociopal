'use client'

import React, { useEffect } from 'react'
import { useChat } from '@/hooks/use-chat'
import { useTextToSpeech } from '@/hooks/use-text-to-speech'
import { useSpeechToText } from '@/hooks/use-speech-to-text'
import { ChatHeader } from './chat-header'
import { ChatMessageList } from './chat-message-list'
import { ChatInput } from './chat-input'

export function ChatContainer() {
  const {
    messages,
    isLoading,
    webSearchEnabled,
    setWebSearchEnabled,
    sendMessage,
    clearMessages,
  } = useChat()

  const {
    isVoiceEnabled,
    isSpeaking,
    currentSpeakingId,
    toggleVoice,
    speak,
    stop: stopSpeaking,
  } = useTextToSpeech({ defaultEnabled: false })

  const {
    isRecording,
    isInitializing: isInitializingSpeech,
    liveTranscript,
    toggleRecording,
    stop: stopRecording,
  } = useSpeechToText({
    onFinalTranscript: (transcript) => {
      if (transcript && transcript.trim()) {
        sendMessage(transcript.trim())
      }
    },
  })

  useEffect(() => {
    if (!isVoiceEnabled || messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'ai' && !lastMessage.isError && lastMessage.id !== 'msg-init') {
      speak(lastMessage.text, lastMessage.id)
    }
  }, [messages, isVoiceEnabled, speak])

  const handleSelectStarterPrompt = (query) => {
    sendMessage(query)
  }

  const handleClearChat = () => {
    stopSpeaking()
    stopRecording()
    clearMessages()
  }

  return (
    <div className="relative flex flex-col h-full w-full max-w-3xl mx-auto bg-[#0c0d0e] border border-zinc-800/80 sm:rounded-2xl shadow-xl overflow-hidden">
      <ChatHeader
        isVoiceEnabled={isVoiceEnabled}
        onToggleVoice={toggleVoice}
        onClearChat={handleClearChat}
        isSpeaking={isSpeaking}
      />

      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        onSpeak={speak}
        speakingMessageId={currentSpeakingId}
        onSelectStarterPrompt={handleSelectStarterPrompt}
      />

      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        webSearchEnabled={webSearchEnabled}
        onToggleWebSearch={() => setWebSearchEnabled((prev) => !prev)}
        isRecording={isRecording}
        isInitializingSpeech={isInitializingSpeech}
        liveTranscript={liveTranscript}
        onToggleRecording={toggleRecording}
      />
    </div>
  )
}
