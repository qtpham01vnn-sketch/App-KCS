import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing ElevenLabs API Key in Authorization header." },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "").trim();

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail?.message || "Failed to fetch voices from ElevenLabs");
    }

    const data = await response.json();
    return NextResponse.json({ success: true, voices: data.voices });
  } catch (error: any) {
    console.error("ElevenLabs Voices API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
