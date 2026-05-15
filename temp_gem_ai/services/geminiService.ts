
import { GoogleGenAI } from "@google/genai";
import { MaterialSelection } from "../types";

export async function askGemAI(
  prompt: string, 
  image?: string, 
  history: any[] = [],
  currentSelection?: MaterialSelection
) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const searchResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history,
        { 
          role: 'user', 
          parts: [{ text: `Yêu cầu khách hàng: "${prompt}".
          
          VẬT LIỆU HIỆN TẠI (PHƯƠNG NAM):
          - Sàn: ${currentSelection?.floor?.name || 'Chưa chọn'}
          - Gạch Chân (Bottom): ${currentSelection?.wallBottom?.name || 'Chưa chọn'}
          - Gạch Thân (Main): ${currentSelection?.wallMain?.name || 'Chưa chọn'}
          - Viền (Border): ${currentSelection?.wallBorder?.name || 'Chưa chọn'}
          - Sơn Nước: ${currentSelection?.paint?.name || 'Chưa chọn'}

          NHIỆM VỤ:
          1. Khẳng định hệ thống AI Phương Nam sẽ ỐP FULL TOÀN BỘ các vách tường trong ảnh, không để sót bất kỳ mảng nào.
          2. Giải thích quy trình: Ốp chân tường cao 60cm -> Ốp thân cao 120cm -> Chạy viền -> Sơn nước đến trần.` }] 
        }
      ],
      config: {
        systemInstruction: "Bạn là chuyên gia kỹ thuật thi công của Gạch Men Phương Nam. Hãy luôn cam kết sự hoàn thiện 100% diện tích bề mặt. Không chấp nhận việc ốp gạch dở dang hoặc để lộ tường cũ."
      },
    });

    const adviceText = searchResponse.text || "Phương Nam đang xử lý bản phối 3D...";
    let visualizedImage = null;
    const isVisualRequest = prompt.toLowerCase().includes('phối') || prompt.toLowerCase().includes('3d') || !!image;

    if (isVisualRequest && image) {
      try {
        // Thuật toán ép AI phủ kín tường
        const wallStrategy = `
          CRITICAL INSTRUCTION - FULL WALL TRANSFORMATION:
          1. MANDATORY: Cover 100% of ALL visible wall surfaces in the image. This includes foreground walls, pillars, corners, and distant walls.
          2. NO ORIGINAL WALL EXPOSED: Every pixel identified as 'wall' must be replaced by the new materials.
          3. TILING ARCHITECTURE (Strict Layering):
             - BOTTOM LAYER (20% of wall height): Apply ${currentSelection?.wallBottom?.name || 'Dark Marble Tile'} texture.
             - MIDDLE LAYER (40% of wall height): Apply ${currentSelection?.wallMain?.name || 'Light Stone Tile'} texture.
             - BORDER LINE (5% of wall height): Apply a distinct horizontal decorative line of ${currentSelection?.wallBorder?.name || 'Decorative Border Tile'}.
             - TOP LAYER (Remaining height to ceiling): Apply a flat, smooth paint finish in color ${currentSelection?.paint?.name || 'PNC-W01 White'} (Hex: ${currentSelection?.paint?.hex || '#F2F3F4'}).
          4. FLOOR: Replace existing floor with ${currentSelection?.floor?.name || '80x80 Glossy Tile'}.
          5. CONSISTENCY: Maintain original room lighting, windows, and structural shadows but with 100% new textures.
        `;

        const renderResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: image.split(',')[1] } },
              { text: wallStrategy }
            ]
          }
        });

        const parts = renderResponse.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            visualizedImage = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      } catch (imgError) {
        console.error("Render Error:", imgError);
      }
    }

    return { text: adviceText, sources: [], visualizedImage };
  } catch (error: any) {
    return { text: "Hệ thống đang bận tối ưu hóa vân gạch, vui lòng đợi trong giây lát!", sources: [], error: true };
  }
}
