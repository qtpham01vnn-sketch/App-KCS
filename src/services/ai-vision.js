import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT_V737, SCHEMA_OCR } from '../lib/constants';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const extractHMIData = async (imageFile) => {
  try {
    // 1. Convert file to GenerativePart
    const base64Data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(imageFile);
    });

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SCHEMA_OCR
      }
    });

    const prompt = SYSTEM_PROMPT_V737;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: imageFile.type
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (error) {
    console.error('Error in extractHMIData:', error);
    throw error;
  }
};
