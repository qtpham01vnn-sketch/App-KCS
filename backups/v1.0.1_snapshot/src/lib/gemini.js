import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT_V737, SCHEMA_OCR } from "./constants";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const runOCR = async (images, prompt = SYSTEM_PROMPT_V737, schema = SCHEMA_OCR) => {
  const modelName = "gemini-flash-latest"; // Dùng bản flash mới nhất không lo bị lỗi thời
  
  try {
    console.log(`🚀 Đang trích xuất với model ổn định: ${modelName}...`);
    
    const requestOptions = {};
    const customBaseUrl = import.meta.env.VITE_GEMINI_BASE_URL;
    if (customBaseUrl) {
      requestOptions.baseUrl = customBaseUrl;
    }

    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    }, requestOptions);
    
    const imageParts = images.map(img => ({
      inlineData: { data: img.base64, mimeType: img.mimeType }
    }));

    const result = await model.generateContent([
      prompt,
      ...imageParts
    ]);

    const response = await result.response;
    return JSON.parse(response.text());

  } catch (error) {
    console.error(`❌ Lỗi AI:`, error.message);
    if (error.message?.includes("503")) {
      throw new Error("Máy chủ AI của Google đang quá tải. Anh vui lòng chờ 30 giây rồi bấm lại nhé!");
    }
    if (error.message?.includes("Failed to fetch")) {
      throw new Error("Lỗi kết nối mạng. Anh kiểm tra lại Wifi/Internet của mình nhé!");
    }
    throw error;
  }
};
