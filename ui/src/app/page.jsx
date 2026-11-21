'use client'

import { ChatContainer } from '@/components/chat/chat-container'

export default function Home() {
  return (
    <div className="relative h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center overflow-hidden">
      <main className="relative z-10 w-full h-full flex justify-center items-center">
        <ChatContainer />
      </main>
    </div>
  )
}
