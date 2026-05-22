import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header. Please provide your Gemini API Key." },
        { status: 401 }
      );
    }

    const apiKey = authHeader.split(" ")[1];
    if (!apiKey) {
      return NextResponse.json({ error: "API Key is empty" }, { status: 401 });
    }

    const body = await req.json();
    const { mode, inputText } = body;

    if (!inputText) {
      return NextResponse.json({ error: "Input text is required" }, { status: 400 });
    }

    // Initialize Google Gen AI with the user's provided key
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a professional video editor and scriptwriter for a "Cinematic Pro Studio". 
Your task is to take the user's input (which could be an article URL, transcript, or raw idea) and turn it into a highly engaging, fast-paced storyboard for a 9:16 short-form video (TikTok/Reels/Shorts).
Keep the video around 30-60 seconds total. Each scene should be 3-6 seconds.
The visual_prompt MUST be a highly detailed, cinematic prompt suitable for an AI image generator (like Midjourney or Imagen) to create the background image for that scene. It should describe lighting, camera angle, subject, and mood (e.g., "Cinematic lighting, extreme close up, dark moody atmosphere, neon green accents...").
The narration MUST be the exact text the AI voice will speak.`;

    const modelsResponse = await ai.models.list();
    let availableModels = [];
    // @ts-ignore
    for await (const m of modelsResponse) {
      if (m.name.includes("gemini")) {
        const modelName = m.name.replace("models/", "");
        availableModels.push(modelName);
      }
    }

    const preferredOrder = [
      "gemini-2.5-flash",
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-pro"
    ];

    const modelsToTry = preferredOrder.filter(m => availableModels.includes(m));
    console.log("Models to try sequentially:", modelsToTry);

    let finalResponse = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log("Attempting generation with model:", model);
        const response = await ai.models.generateContent({
          model: model,
          contents: [
            { role: "user", parts: [{ text: systemPrompt + "\n\nInput Content:\n" + inputText }] }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              description: "List of scenes for the video storyboard",
              items: {
                type: Type.OBJECT,
                properties: {
                  scene_number: { type: Type.INTEGER, description: "Sequential scene number starting from 1" },
                  narration: { type: Type.STRING, description: "The voiceover script for this scene" },
                  visual_prompt: { type: Type.STRING, description: "Highly detailed image generation prompt for the scene background" },
                  duration_seconds: { type: Type.NUMBER, description: "Estimated duration of the scene in seconds (usually 3-6s)" },
                },
                required: ["scene_number", "narration", "visual_prompt", "duration_seconds"],
              },
            },
            temperature: 0.7,
          }
        });
        
        finalResponse = response;
        console.log(`Success with ${model}`);
        break; 
      } catch (err: any) {
        console.error(`Failed with ${model}: ${err.message}`);
        lastError = err;
      }
    }

    if (!finalResponse) {
      throw lastError || new Error("All available models failed to process the request.");
    }

    if (!finalResponse.text) {
      throw new Error("Gemini returned an empty response");
    }

    const storyboard = JSON.parse(finalResponse.text);

    return NextResponse.json({ success: true, storyboard });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate storyboard" },
      { status: 500 }
    );
  }
}
