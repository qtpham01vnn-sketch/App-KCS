import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ success: false, error: "Missing text" }, { status: 400 });
    }

    // Google Translate TTS limits to around 200 chars. We truncate if needed.
    const safeText = text.substring(0, 200);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${encodeURIComponent(safeText)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch from Google TTS" }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert to Base64 to match our frontend logic
    const base64Audio = buffer.toString('base64');
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({
      success: true,
      audio_base64: audioDataUrl
    });

  } catch (error: any) {
    console.error("Google TTS Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
