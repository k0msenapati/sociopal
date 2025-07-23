import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { NextResponse } from 'next/server';

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(request) {
  const { text, voiceId } = await request.json();

  try {
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
