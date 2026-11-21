export async function getAssemblyAIToken() {
  try {
    const res = await fetch('/api/token')
    if (!res.ok) return null
    const data = await res.json()
    return data.token || null
  } catch {
    return null
  }
}

export async function requestElevenLabsTTS(text, voiceId = 'JBFqnCBsd6RMkjVDRZzb') {
  try {
    const res = await fetch('/api/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId }),
    })

    if (!res.ok) return null
    return await res.blob()
  } catch {
    return null
  }
}
