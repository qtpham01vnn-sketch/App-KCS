import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing ElevenLabs API Key in Authorization header." },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();
    const body = await req.json();
    const { voice_id, text } = body;

    if (!voice_id || !text) {
      return NextResponse.json(
        { error: "Missing voice_id or text in request body." },
        { status: 400 }
      );
    }

    // Call ElevenLabs Text-to-Speech API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = "Failed to generate audio from ElevenLabs";
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.detail?.message || errorJson.detail || errorMsg;
      } catch (e) {
        errorMsg = errorText;
      }
      throw new Error(errorMsg);
    }

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    return NextResponse.json({ 
      success: true, 
      audio_base64: `data:audio/mp3;base64,${base64Audio}` 
    });
  } catch (error: any) {
    console.error("ElevenLabs Generate API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
