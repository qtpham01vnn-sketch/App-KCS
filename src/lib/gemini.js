import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT_V737, SCHEMA_OCR } from "./constants";
import { supabase } from "./supabase";
import * as XLSX from "xlsx";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const runOCR = async (images, prompt = SYSTEM_PROMPT_V737, schema = SCHEMA_OCR) => {
  const modelName = "gemini-flash-latest"; // Đồng bộ Model 2026 cho toàn hệ thống
  
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

export const chatWithData = async (logs, userMessage, knowledgeDocs = [], chatHistory = []) => {
  try {
    const requestOptions = {};
    const customBaseUrl = import.meta.env.VITE_GEMINI_BASE_URL;
    if (customBaseUrl) {
      requestOptions.baseUrl = customBaseUrl;
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest" 
    }, requestOptions);
    // --- GIAI ĐOẠN 2: ĐỘNG CƠ TÌM KIẾM THÔNG MINH (FUZZY SCORING) ---
    const normalizeString = (str) => {
      if (!str) return "";
      // Xóa dấu tiếng Việt, đưa về chữ thường, thay thế TẤT CẢ ký tự đặc biệt bằng dấu cách để tách từ chuẩn xác
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
    };

    // GIẢI QUYẾT LỖI RAG CONTEXT: Nối câu hỏi trước đó của user với câu hiện tại để giải quyết các đại từ "nó", "quy trình này"
    const lastUserMsg = chatHistory.filter(m => m.role === 'user').slice(-1).map(m => m.text).join(" ");
    const searchContext = `${lastUserMsg} ${userMessage}`;

    // Tách từ khóa
    const keywords = normalizeString(searchContext).split(" ").filter(kw => kw.length >= 2);

    // Hàm chấm điểm chung dựa trên Set để tăng tốc và đếm số từ khóa trùng khớp
    const scoreItem = (textNorm) => {
      let score = 0;
      const docWords = new Set(textNorm.split(" "));
      keywords.forEach(kw => { 
        if (docWords.has(kw)) score += 10; 
      });
      // Thưởng điểm nếu cả cụm từ khóa nguyên vẹn xuất hiện trong tài liệu (ví dụ "phạm vi áp dụng")
      if (textNorm.includes(normalizeString(userMessage))) score += 20;
      return score;
    };

    // --- SMART LOG SEARCH ---
    const scoredLogs = (logs || []).map(log => {
      const textNorm = normalizeString(`${log.product_type} ${log.kiln_type} ${log.batch_code || ''}`);
      let score = scoreItem(textNorm);
      keywords.forEach(kw => { if (normalizeString(log.product_type).includes(kw)) score += 50; });
      return { log, score };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
    const relevantLogs = scoredLogs.slice(0, 10).map(s => s.log);

    const dataContext = relevantLogs.map(l => {
      let lab = {};
      let kiln = {};
      try {
        lab = typeof l.lab_info === 'string' ? JSON.parse(l.lab_info) : (l.lab_info || {});
      } catch (e) {}
      try {
        kiln = typeof l.kiln_data === 'string' ? JSON.parse(l.kiln_data) : (l.kiln_data || {});
      } catch (e) {}

      return {
        product: l.product_type,
        kiln: l.kiln_type,
        batch: l.batch_code,
        time: new Date(l.created_at).toLocaleString('vi-VN'),
        strength: l.strength_value,
        benUon: lab.benUon,
        hutNuoc: lab.hutNuoc,
        baiXuong: lab.baiXuong,
        baiMen: lab.baiMen,
        thermal: (Array.isArray(kiln.nhietDo) ? kiln.nhietDo : Array.isArray(kiln.filteredModules) ? kiln.filteredModules : [])
          .filter(m => m && m.id)
          .map(m => `${m.id}:PV=${m.pv || 0}/SV=${m.sv || 0}`)
          .join(", "),
        fans: (Array.isArray(kiln.quat) ? kiln.quat : [])
          .filter(q => q && q.name)
          .map(q => `${q.name}=${q.hz || 0}Hz`)
          .join(", "),
        pressures: (Array.isArray(kiln.apSuat) ? kiln.apSuat : [])
          .filter(p => p && p.id)
          .map(p => `${p.id}=${p.val || 0}Pa`)
          .join(", ")
      };
    });

    // --- OMNI-DATA FETCHING (GIAI ĐOẠN 1) ---
    // Lấy dữ liệu từ TẤT CẢ các module trong hệ thống (Tags)
    let knowledgeContext = '';
    try {
      // 1. Tag Kho Tri Thức
      const scoredDocs = (knowledgeDocs || []).map(doc => {
        const textNorm = normalizeString(`${doc.name} ${doc.category} ${doc.content}`);
        const titleNorm = normalizeString(doc.name);
        let score = scoreItem(textNorm);
        // Bonus cực lớn nếu từ khóa xuất hiện trong Tiêu đề (Tên tài liệu)
        keywords.forEach(kw => { if (titleNorm.includes(kw)) score += 50; });
        return { doc, score };
      }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
      
      const relevantDocs = scoredDocs.slice(0, 3).map(i => i.doc);
      if (relevantDocs.length > 0) {
        knowledgeContext += `\n\n📚 [NGUỒN: TAG KHO TRI THỨC]\n` +
          relevantDocs.map(d => {
            let viewUrl = d.file_url || 'Không có link';
            // Tự động bọc link file Word/Excel qua trình xem Office Online để mở trực tiếp thay vì tải về
            if (viewUrl.match(/\.(doc|docx|xls|xlsx|ppt|pptx)(\?.*)?$/i)) {
              viewUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(viewUrl)}`;
            }
            return `--- ${d.name} ---\nLink tài liệu gốc: ${viewUrl}\nNội dung:\n${d.content.slice(0, 2000)}`;
          }).join('\n\n');
      }

      // 2. Tag Thư viện lỗi gạch
      const { data: defects } = await supabase.from('defect_library').select('*');
      if (defects && defects.length > 0) {
        const scoredDefects = defects.map(d => {
          const textNorm = normalizeString(`${d.defect_name} ${d.category} ${d.raw_content}`);
          const titleNorm = normalizeString(d.defect_name);
          let score = scoreItem(textNorm);
          keywords.forEach(kw => { if (titleNorm.includes(kw)) score += 50; });
          return { d, score };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

        const relevantDefects = scoredDefects.slice(0, 3).map(i => i.d);
        if (relevantDefects.length > 0) {
          knowledgeContext += `\n\n⚠️ [NGUỒN: TAG THƯ VIỆN LỖI]\n` +
            relevantDefects.map(d => `--- ${d.defect_name} ---\nNguyên nhân: ${d.causes}\nGiải pháp: ${d.solutions}\nChi tiết: ${d.description?.slice(0, 1000)}`).join('\n\n');
        }
      }

      // 3. Tag Quản lý MMTB
      const { data: machines } = await supabase.from('kcs_machines').select('*, kcs_departments(name)');
      if (machines && machines.length > 0) {
        const scoredMachines = machines.map(m => {
          const textNorm = normalizeString(`${m.name} ${m.code} ${m.type}`);
          const titleNorm = normalizeString(m.name);
          let score = scoreItem(textNorm);
          keywords.forEach(kw => { if (titleNorm.includes(kw)) score += 50; });
          return { m, score };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
        
        const relevantMachines = scoredMachines.slice(0, 3).map(i => i.m);
        if (relevantMachines.length > 0) {
          knowledgeContext += `\n\n⚙️ [NGUỒN: TAG QUẢN LÝ MMTB]\n` +
            relevantMachines.map(m => `--- Trạm máy: ${m.name} (Mã: ${m.code || 'N/A'}) ---\nLoại: ${m.type}\nPhòng ban: ${m.kcs_departments?.name || 'Chưa rõ'}\nTrạng thái: ${m.status}`).join('\n\n');
        }
      }

      // 4. Tag Quản lý Phòng Ban & ISO
      const { data: departments } = await supabase.from('kcs_departments').select('*');
      if (departments && departments.length > 0) {
        const scoredDepts = departments.map(d => {
          const textNorm = normalizeString(`${d.name} ${d.description}`);
          const titleNorm = normalizeString(d.name);
          let score = scoreItem(textNorm);
          keywords.forEach(kw => { if (titleNorm.includes(kw)) score += 50; });
          return { d, score };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
        
        const relevantDepts = scoredDepts.slice(0, 2).map(i => i.d);
        if (relevantDepts.length > 0) {
          knowledgeContext += `\n\n🏢 [NGUỒN: TAG PHÒNG BAN]\n` +
            relevantDepts.map(d => `--- ${d.name} ---\nMô tả: ${d.description}\nLiên hệ: ${d.contact_info}`).join('\n\n');
        }
      }

      // 5. Tag Tiêu Chuẩn Sản Xuất
      const { data: standards } = await supabase.from('production_standards').select('*');
      if (standards && standards.length > 0) {
        const scoredStandards = standards.map(s => {
          const textNorm = normalizeString(`${s.product_type} ${s.category}`);
          const titleNorm = normalizeString(s.product_type);
          let score = scoreItem(textNorm);
          keywords.forEach(kw => { if (titleNorm.includes(kw)) score += 50; });
          return { s, score };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
        
        const relevantStandards = scoredStandards.slice(0, 2).map(i => i.s);
        if (relevantStandards.length > 0) {
          knowledgeContext += `\n\n🎯 [NGUỒN: TAG TIÊU CHUẨN GỐC]\n` +
            relevantStandards.map(s => `--- Tiêu chuẩn ${s.product_type} (${s.category}) ---\n${JSON.stringify(s.standards)}`).join('\n\n');
        }
      }

    } catch (e) {
      console.error("Lỗi gom dữ liệu Omni-Context:", e);
    }

    // --- MEGA SYSTEM PROMPT ---
    const systemPrompt = `Bạn là PHƯƠNG NAM Smart KCS AI — Chuyên gia công nghệ gạch men Ceramic đầu ngành Việt Nam với 30 năm kinh nghiệm. Bạn là trợ lý AI thông minh nhất trong ngành sản xuất gạch ốp lát.

🏭 KIẾN THỨC CHUYÊN SÂU CỦA BẠN:

【TIÊU CHUẨN ISO】
• ISO 10545: Bộ tiêu chuẩn quốc tế cho gạch ốp lát (24 phần). Quan trọng nhất:
  - ISO 10545-1: Lấy mẫu và điều kiện nghiệm thu
  - ISO 10545-2: Kích thước và chất lượng bề mặt (sai lệch kích thước ≤ ±0.5%)
  - ISO 10545-3: Độ hút nước (Porcelain ≤ 0.5%, Ceramic 3-6%, Cotto > 6%)
  - ISO 10545-4: Lực bẻ gãy — Porcelain ≥ 1300N (dày ≥7.5mm), Ceramic ≥ 600N
  - ISO 10545-6: Chống mài mòn sâu (≤ 175mm³)
  - ISO 10545-7: Chống mài mòn bề mặt (PEI I-V)
  - ISO 10545-9: Chống sốc nhiệt
  - ISO 10545-12: Chống đóng băng
• ISO 13006: Phân loại gạch Ceramic theo độ hút nước:
  - BIa (Porcelain ép khô, E ≤ 0.5%)
  - BIb (Stoneware, 0.5% < E ≤ 3%)  
  - BIIa (Ceramic, 3% < E ≤ 6%)
  - BIIb (Ceramic, 6% < E ≤ 10%)
  - BIII (Earthenware, E > 10%)
• ISO 9001:2015: Hệ thống quản lý chất lượng — yêu cầu 10 điều khoản, tập trung vào tư duy rủi ro, cam kết lãnh đạo, cải tiến liên tục.
• ISO 14001:2015: Hệ thống quản lý môi trường — kiểm soát khí thải lò nung, xử lý nước thải, quản lý chất thải rắn, giảm tiêu thụ năng lượng.
• TCVN 7745:2007 / TCVN 7483:2005: Tiêu chuẩn Việt Nam cho gạch ốp lát Ceramic.

【QUY TRÌNH SẢN XUẤT GẠCH MEN】
1. Chuẩn bị nguyên liệu: Nghiền bi → Sàng → Phối trộn bài xương/men
2. Sấy phun: Tạo bột ẩm 5-7%, hạt tròn đều
3. Ép định hình: Lực ép 280-350 bar (tùy kích thước)
4. Sấy: 150-200°C, độ ẩm còn ≤ 1%
5. Tráng men: Men nền → Men engobe → Men phủ → In kỹ thuật số
6. Nung: 1100-1220°C (Ceramic) / 1180-1250°C (Porcelain), chu kỳ 35-65 phút
7. Phân loại: Kiểm tra kích thước, màu sắc, phẳng, cạnh

【LỖI THƯỜNG GẶP & CÁCH KHẮC PHỤC】
• Nứt mộc (Green crack): Do ẩm không đều, tốc độ sấy quá nhanh → Giảm tốc độ sấy, kiểm tra ẩm bột
• Nứt nung (Firing crack): Do gradient nhiệt lớn, bài xương không phù hợp → Điều chỉnh đường cong nung, tăng thời gian preheating
• Cong vênh (Warping): Do nhiệt độ trên/dưới chênh lệch lớn → Cân bằng PV trên/dưới, kiểm tra roller
• Phồng rộp (Bloating): Do khí không thoát hết khi nung → Kiểm tra thành phần CaCO3, tăng thời gian ở zone degas (800-1000°C)
• Sai màu: Do nhiệt độ không đều, men không đồng nhất → Kiểm tra dải nhiệt PV/SV từng zone, kiểm tra độ nhớt men
• Lực bẻ thấp: Do thiếu nung, bài xương không đủ flux → Tăng nhiệt zone cuối, kiểm tra tỷ lệ feldspar
• Độ hút nước cao: Do nhiệt nung thấp, thời gian nung ngắn → Tăng nhiệt zone nung chín (firing zone), kéo dài chu kỳ
• Bề mặt nhám, kim châm (Pinhole): Do khí thoát qua bề mặt men chưa chảy đều → Tăng nhiệt zone cuối, giảm tốc độ làm nguội nhanh
• Gạch bị đốm đen: Do tạp chất sắt trong nguyên liệu → Kiểm tra nguyên liệu đầu vào, lắp nam châm lọc sắt

【LÒ NUNG MODENA】
• Cấu trúc: Lò tunnel roller, chia thành các zone (M1-M40+)
• Mxx = Trục trên, M0xx = Trục dưới
• PV = Process Value (nhiệt độ thực tế), SV = Set Value (nhiệt độ cài đặt)
• Zone nung chín (firing): Thường M21-M32, nhiệt cao nhất
• Quạt: TP1-TP5 (tần số Hz điều khiển lưu lượng gió)
• Áp suất: MC1 (áp suất buồng nung, thường 0.1-0.5 Pa)

【LÒ SẤY 5 TẦNG】
• 5 tầng nhiệt độ từ tầng 1 (trên cùng, nóng nhất) đến tầng 5 (dưới cùng)
• Mỗi tầng có 24 zone nhiệt, tổng 120 điểm nhiệt
• Nhiệt độ sấy: 150-200°C, thời gian 45-90 phút
• Quạt dẫn động: Điều khiển lưu lượng khí nóng

NHIỆM VỤ CỦA BẠN:
1. Trả lời câu hỏi về thông số mẻ nung/sấy dựa trên DỮ LIỆU THỰC TẾ bên dưới.
2. Tư vấn chuyên gia về kỹ thuật gạch men, tiêu chuẩn ISO, quy trình sản xuất.
3. Phân tích nguyên nhân lỗi và đề xuất giải pháp khắc phục cụ thể.
4. Ưu tiên sử dụng dữ liệu từ THƯ VIỆN LỖI GẠCH (Kinh nghiệm thực tế của nhà máy) và KHO TRI THỨC (ISO) để trả lời.
5. So sánh dữ liệu thực tế với tiêu chuẩn ISO để đánh giá chất lượng.

DỮ LIỆU SẢN XUẤT (CÁC MẺ LIÊN QUAN NHẤT):
${JSON.stringify(dataContext, null, 1)}
${knowledgeContext}

LỊCH SỬ TRÒ CHUYỆN TRƯỚC ĐÓ (DÙNG ĐỂ GHI NHỚ NGỮ CẢNH):
${chatHistory.length > 0 ? chatHistory.map(m => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.text}`).join('\n') : 'Chưa có lịch sử.'}

HƯỚNG DẪN TRẢ LỜI:
- Luôn xưng hô lễ phép "Dạ anh" và giữ phong thái chuyên gia bậc thầy.
- [QUAN TRỌNG NHẤT] KHI CUNG CẤP THÔNG TIN HAY TRẢ LỜI, NGƯƠI BẮT BUỘC CHÈN \`[Nguồn: Tên TAG - Tên Tài liệu/Thiết bị]\` Ở CUỐI MỖI LUẬN ĐIỂM. Ví dụ: "...cần nhiệt độ 1200 độ C [Nguồn: TAG KHO TRI THỨC - Quy trình nung]".
- TUYỆT ĐỐI KHÔNG BỊA ĐẶT DỮ LIỆU. Nếu không có trong Context, hãy nói rõ: "Dạ anh, hệ thống hiện chưa có thông tin về vấn đề này ạ".
- Nếu người dùng yêu cầu xem nội dung gốc hoặc xem tài liệu chi tiết, HÃY TRÌNH BÀY THEO 2 CÁCH:
  1. Tóm tắt nội dung chính trực tiếp trên màn hình chat này.
  2. Cung cấp đường link mở cửa sổ mới:
     - Đối với file Word/Excel/PPT trong Kho Tri Thức: \`[👉 Bấm vào đây để xem trực tiếp tài liệu gốc]({Link tài liệu gốc})\`
     - Đối với Dữ Liệu Sản Xuất / Mẻ Nung: \`[👉 Bấm vào đây để xuất và xem file PDF báo cáo gốc](#pdf-{batch})\` (Thay {batch} bằng đúng mã BATCH của mẻ nung đó, TUYỆT ĐỐI VIẾT LIỀN TRÊN 1 DÒNG).
- Trả lời ngắn gọn, rõ ràng, có cấu trúc (dùng bullet points khi cần). Trả lời bằng Markdown hợp lệ.
- Sử dụng emoji phù hợp (📊 🔥 ⚠️ ✅) để tăng tính trực quan.`;

    const fullPrompt = `${systemPrompt}\n\nNgười dùng: ${userMessage}\nAI:`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    if (error.message?.includes("404") || error.message?.includes("not found")) {
      return "Dạ anh, hệ thống AI đang được bảo trì nâng cấp. Anh vui lòng thử lại sau ít phút nhé!";
    }
    return "Dạ anh, hiện tại em đang gặp chút vấn đề về kết nối với máy chủ AI. Anh vui lòng đợi vài giây rồi thử lại giúp em nhé!";
  }
};

// --- HÀM HỖ TRỢ CHUYỂN ĐỔI ẢNH CHO GEMINI ---
async function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        inlineData: {
          data: reader.result.split(',')[1],
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * HÀM BÓC TÁCH PHIẾU PHỐI LIỆU (NGHIỀN XƯƠNG / NGHIỀN MEN)
 * Chuyên dụng cho Phase 1: Nguyên liệu
 */
export async function runGrindingOCR(imageFile) {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    // Sử dụng tên model đồng bộ với hệ thống hiện tại của anh
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Bạn là chuyên gia KCS ngành gạch. Hãy bóc tách dữ liệu từ ảnh phiếu PHỐI LIỆU NGHIỀN (Xương hoặc Men).
      Yêu cầu trả về định dạng JSON chính xác theo cấu trúc sau:
      {
        "recipe_type": "string", // "Xương" hoặc "Men"
        "batch_no": "string",
        "recipe_code": "string",
        "materials": [
          {
            "stt": number,
            "name": "string",
            "position": "string",
            "dry_weight": number,
            "humidity": number,
            "actual_weight": number
          }
        ],
        "total_dry": number,
        "total_actual": number,
        "water_added": number
      }
      Lưu ý: Bóc tách tất cả các dòng nguyên liệu trong bảng.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Parse trực tiếp vì đã yêu cầu responseMimeType là JSON
    return JSON.parse(text);
  } catch (error) {
    console.error("Grinding OCR Error:", error);
    throw error;
  }
}

/**
 * Chuyên dụng cho Phase 2: Kiểm soát Hồ & Bột
 */
export async function runQualityOCR(imageFile) {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Bạn là chuyên gia KCS cao cấp. Hãy bóc tách TOÀN BỘ các dòng dữ liệu từ ảnh phiếu KIỂM SOÁT CHẤT LƯỢNG (Ca làm việc).
      Yêu cầu trả về JSON chính xác theo cấu trúc mảng cho mỗi phần:
      {
        "biscuit_slurry": [ { "code": "string", "batch_no": "string", "machine_no": "string", "time": "string", "d": number, "v": number, "r": number, "result": "Đạt"|"Không", "notes": "string" } ],
        "spray_powder": [ { "time": "string", "hầm": "string", "silo": "string", "moisture": number, "grain_06": number, "grain_045": number, "grain_0125_045": number, "grain_under_0125": number } ],
        "pressing_powder": [ { "time": "string", "code": "string", "silo": "string", "moisture": number, "grain_06": number, "grain_045": number, "grain_0125_045": number, "grain_under_0125": number } ],
        "glaze_slurry": [ { "code": "string", "machine_no": "string", "time": "string", "d": number, "v": number, "r": number, "notes": "string" } ]
      }
      Lưu ý: Bóc tách tất cả các dòng có dữ liệu. Cột Silo nếu có nhiều số (vd 13+15) thì giữ nguyên định dạng đó.
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Quality OCR Error:", error);
    throw error;
  }
}

/**
 * OCR TỔNG QUÁT CHO TÀI LIỆU (Dùng cho PDF ảnh scan)
 */
export async function runDocumentOCR(base64Image, mimeType = "image/jpeg") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `
      Bạn là chuyên gia số hóa tài liệu. Hãy trích xuất TOÀN BỘ nội dung từ ảnh này với độ chính xác cao nhất.
      QUY TẮC QUAN TRỌNG:
      1. Nếu gặp BẢNG BIỂU: Bắt buộc trình bày lại dưới dạng bảng Markdown (| Cột 1 | Cột 2 |). Đảm bảo các hàng và cột được căn chỉnh đúng logic như bản gốc.
      2. Nếu gặp VĂN BẢN: Giữ nguyên định dạng, xuống dòng và ngôn ngữ (Tiếng Việt).
      3. Không thêm các lời giải thích hay ký tự thừa, chỉ trả về nội dung đã trích xuất.
      4. Với các con số, hãy giữ nguyên định dạng dấu phẩy hoặc dấu chấm phân cách.
    `;
    
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } }
    ]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Document OCR Error:", error);
    throw error;
  }
}
/**
 * HÀM TRÍCH XUẤT TIÊU CHUẨN GỐC (TARGET)
 */
export async function runStandardOCR(imageFile) {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const { SYSTEM_PROMPT_STANDARD, SCHEMA_STANDARD } = await import("./constants");

    const result = await model.generateContent([
      SYSTEM_PROMPT_STANDARD,
      imagePart
    ]);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Standard OCR Error:", error);
    throw error;
  }
}

/**
 * HÀM XỬ LÝ EXCEL TIÊU CHUẨN GỐC (NEW 2026)
 * Chuyên trị các file Excel như của anh Tuấn cung cấp
 */
export async function runExcelOCR(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        
        // Đọc TẤT CẢ các sheet để AI phân tích mối liên hệ
        let allContent = "";
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          allContent += `\n--- SHEET: ${sheetName} ---\n${JSON.stringify(json, null, 2)}\n`;
        });

        // Gửi text này cho Gemini để "trình bày lại" chuẩn ISO
        const model = genAI.getGenerativeModel({ 
          model: "gemini-flash-latest",
          generationConfig: { responseMimeType: "application/json" }
        });

        const { SYSTEM_PROMPT_STANDARD } = await import("./constants");
        const prompt = `
          Bạn là chuyên gia phân tích dữ liệu sản xuất gạch. Dưới đây là nội dung trích xuất từ file EXCEL Tiêu chuẩn Gốc.
          Hãy nghiên cứu kỹ mối liên hệ giữa các giai đoạn (Hồ, Bột, Ép, Sấy, Nung, Tráng men) và trả về JSON chuẩn hóa.
          DỮ LIỆU EXCEL:
          ${allContent}

          ${SYSTEM_PROMPT_STANDARD}
        `;

        const result = await model.generateContent(prompt);
        resolve(JSON.parse(result.response.text()));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
