import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ELEVENLABS_API_KEY is not configured' },
      { status: 503 }
    );
  }

  const { text, voiceId = 'JBFqnCBsd6RMkjVDRZzb' } = await request.json();

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });
    const audioStream = await elevenlabs.textToSpeech.stream(voiceId, {
      text,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
    });

    return new Response(audioStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 });
  }
}
