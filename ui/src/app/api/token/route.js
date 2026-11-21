export async function GET() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 503 })
  }

  const expiresInSeconds = 60
  const url = `https://streaming.assemblyai.com/v3/token?expires_in_seconds=${expiresInSeconds}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    return new Response(JSON.stringify({ token: data.token }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error generating temp token:', error.message)
    return new Response(JSON.stringify({ error: 'Failed to fetch token' }), { status: 500 })
  }
}
