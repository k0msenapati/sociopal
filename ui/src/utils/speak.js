export async function speak(text, voiceId = 'JBFqnCBsd6RMkjVDRZzb') {
  try {
    const response = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    })

    if (!response.ok) throw new Error('TTS failed')

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.play()
  } catch (err) {
    console.error('[TTS Error]:', err)
  }
}
