import { requestElevenLabsTTS } from '@/services/speech'

export async function speak(text, voiceId = 'JBFqnCBsd6RMkjVDRZzb') {
  if (!text || typeof window === 'undefined') return

  try {
    const audioBlob = await requestElevenLabsTTS(text, voiceId)
    if (!audioBlob) return

    const url = URL.createObjectURL(audioBlob)
    const audio = new Audio(url)
    audio.play().catch(() => {})
  } catch (err) {
    console.error('[TTS Error]:', err)
  }
}
