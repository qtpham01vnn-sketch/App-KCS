import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function GET(req: NextRequest) {
  try {
    // Get key from search params for quick testing: /api/test-models?key=YOUR_KEY
    const url = new URL(req.url);
    const apiKey = url.searchParams.get("key");

    if (!apiKey) {
      return NextResponse.json({ error: "Please provide ?key=YOUR_API_KEY in the URL" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.list();
    
    // @ts-ignore - response might be an async iterable in the new SDK
    const models = [];
    for await (const model of response) {
      models.push(model.name);
    }

    return NextResponse.json({ success: true, available_models: models });
  } catch (error: any) {
    console.error("Test API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
