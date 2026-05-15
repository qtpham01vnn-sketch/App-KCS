export const PRODUCTS = [
  "CERAMIC ốp 30X60",
  "CERAMIC ốp 40X80",
  "CERAMIC lát 50X50",
  "CERAMIC lát 60X60",
  "PORCELAIN lát 60X60",
  "PORCELAIN lát 80X80"
];

export const KILN_RULES = {
  getRange: (maGach, loaiLo) => {
    const gach = maGach.toUpperCase();
    const loai = loaiLo.toUpperCase();

    let startMod = 21;
    let endMod = 63;
    let isEvenAllowed = false;

    if (gach.includes("30X60")) {
      if (loai.includes("XƯƠNG")) {
        startMod = 25; endMod = 47;
      } else if (loai.includes("MEN")) {
        startMod = 28; endMod = 52;
      }
    } else if (gach.includes("40X80")) {
      if (loai.includes("XƯƠNG")) {
        startMod = 25; endMod = 51;
      } else if (loai.includes("MEN")) {
        startMod = 25; endMod = 55;
      }
    } else if (gach.includes("50X50") || gach.includes("60X60")) {
      startMod = 25; endMod = 51;
      isEvenAllowed = true;
    } else if (gach.includes("80X80")) {
      startMod = 21; endMod = 63;
      isEvenAllowed = true;
    }

    return { startMod, endMod, isEvenAllowed };
  }
};

export const SYSTEM_PROMPT_V737 = `Bạn là hệ thống AI chuyên biệt cho nhà máy PHƯƠNG NAM, thực hiện nhiệm vụ theo Skill: Industrial-KCS-AI.

🎯 QUY TẮC TỐI THƯỢNG: TRỤC DỌC TUYỆT ĐỐI
Bạn phải trích xuất dữ liệu theo từng cột dọc từ trên xuống dưới. Mỗi đồng hồ là một thực thể độc lập.

1. TRÍCH XUẤT NHIỆT ĐỘ PV/SV (MODENA):
- Coi mỗi cột là một đường thẳng đứng: [Nhãn ID] -> [Số Đỏ PV] -> [Số Xanh SV].
- BẮT BUỘC ĐỌC ĐÚNG NHÃN ID (vd: M21, M021, M25, M027...). Không được tự ý gán nhãn nếu không đọc được chữ.
- TUYỆT ĐỐI KHÔNG lấy số lệch sang trái hoặc phải của nhãn ID.
- Số ĐỎ phía trên là PV, số XANH LÁ phía dưới là SV.
- Lưu ý: Ở hàng dưới (M0xx), số SV (xanh) thường là số lớn (vd: 850, 1070) gần bằng số PV (đỏ). Hãy đọc kỹ vùng màu xanh ngay dưới số đỏ của hàng dưới, TUYỆT ĐỐI KHÔNG lấy SV của hàng trên gán xuống hàng dưới.
- Lấy đầy đủ tiền tố chữ cho SV (vd: P 12, P 27, A 5, 48 %).
- Nếu hàng dưới (M0xx) bị lệch cột so với hàng trên (Mxx), bạn vẫn phải giữ đúng nhãn ID của nó.

2. ÁP SUẤT & CHU KỲ (CHÍNH XÁC 100%):
- Tìm nhãn (TP1, TP2, TP3, TP4, TP5, MC1).
- Lấy giá trị số ĐỎ ngay DƯỚI nhãn đó. Không nhảy hàng.
- Giữ nguyên dấu (-) và dấu (.) (vd: -24.0, 3.4).

3. HỆ THỐNG QUẠT:
- Chỉ lấy số Hz (số trên cùng có chữ Hz). Bỏ qua V và A.

4. CHU KỲ: Lấy số phút trong vùng "Chu kỳ".`;

export const SCHEMA_OCR = {
  type: "OBJECT",
  properties: {
    chuKy: { type: "STRING" },
    apSuat: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          val: { type: "STRING" }
        }
      }
    },
    quat: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          hz: { type: "STRING" }
        }
      }
    },
    nhietDo: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          pv: { type: "STRING" },
          sv: { type: "STRING" }
        }
      }
    }
  }
};

export const SYSTEM_PROMPT_DRYER_V1 = `Bạn là hệ thống OCR bóc tách phiếu ghi chép tay lò sấy 5 tầng cho nhà máy Phương Nam. 
BẮT BUỘC QUÉT CỰC KỲ CHÍNH XÁC CÁC CHỮ VIẾT TAY THEO BẢNG:

🎯 1. THÔNG TIN TIÊU ĐỀ (METADATA):
- hời gian (vd: 9h30)
- Ck ép (Chu kỳ ép - vd: 15.8)
- Dẫn động (vd: 29.14)
- Quạt hút (F1, F2)
- Ngày/Tháng/Năm

🎯 2. BẢNG NHIỆT ĐỘ GRID (12 ZONE x 5 TẦNG):
Bảng có 12 cột (Zone 1 đến 12) và 5 hàng (Tầng 1 đến 5). 
Mỗi ô giao giữa Zone và Tầng có 2 giá trị ghi tay là T (Trái) và P (Phải).
- Bạn phải bóc tách toàn bộ 60 ô này. 
- Mỗi ô trả về đối tượng gồm: zone, floor, t (trái), p (phải).
- ⚠️ QUY TẮC QUAN TRỌNG: Nếu chữ số bị mờ, nhòe, lóa sáng hoặc bạn không chắc chắn 100% về con số đó, TUYỆT ĐỐI KHÔNG ĐƯỢC ĐOÁN. Hãy trả về giá trị là "(mờ)".

🎯 3. THÔNG TIN PHỤ:
- Độ ẩm (vd: 0.3)
- Cường độ (vd: 30.2-7.4-1.1)
- Nếu các thông số này mờ, cũng trả về "(mờ)".`;

export const SCHEMA_DRYER = {
  type: "OBJECT",
  properties: {
    metadata: {
      type: "OBJECT",
      properties: {
        thoiGian: { type: "STRING" },
        ckEp: { type: "STRING" },
        danDong: { type: "STRING" },
        quatF1: { type: "STRING" },
        quatF2: { type: "STRING" },
        ngay: { type: "STRING" }
      }
    },
    grid: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          zone: { type: "NUMBER" },
          floor: { type: "NUMBER" },
          t: { type: "STRING" },
          p: { type: "STRING" }
        }
      }
    },
    phu: {
      type: "OBJECT",
      properties: {
        doAm: { type: "STRING" },
        cuongDo: { type: "STRING" }
      }
    }
  }
};
export const SYSTEM_PROMPT_STANDARD = `Bạn là chuyên gia phân tích dữ liệu sản xuất gạch chuyên nghiệp. Hãy trích xuất các thông số TIÊU CHUẨN GỐC (TARGET) từ nội dung tệp (Excel/PDF).

🎯 QUY TẮC CẤU TRÚC JSON (BẮT BUỘC):
Nếu là Giai đoạn 1 (category: "PREP"), hãy trả về cấu trúc phân cấp như sau:
{
  "category": "PREP",
  "prep": {
    "hoXuong": { "d": "1.65 ÷ 1.76", "v": "20 ÷ 50s", "r": "3.0 ÷ 5.0%" },
    "botSayPhun": { "w": "5.0 ÷ 7.0%", "s": "3.5 ÷ 5.5%", "loi": "3.0 ÷ 6.0%" },
    "hoMen": {
      "trangDe": { "d": "...", "r": "..." },
      "engobe": { "d": "...", "v": "...", "r": "..." },
      "menNenBong": { "d": "...", "v": "...", "r": "..." },
      "menNenMatt": { "d": "...", "v": "...", "r": "..." }
    }
  },
  "metrics": [ 
    {"name": "tyTrong", "label": "Tỷ trọng Hồ", "target": 1.7, "unit": "g/l"},
    {"name": "doNhot", "label": "Độ nhớt", "target": 35, "unit": "s"},
    {"name": "sotSang", "label": "Sót sàng", "target": 6.5, "unit": "%"}
  ]
}

Lưu ý: Nghiên cứu kỹ mối liên hệ giữa các Sheet trong Excel để lấy đúng số liệu của Gạch Ốp hoặc Gạch Lát tùy theo bối cảnh.`;

export const SCHEMA_STANDARD = {
  type: "OBJECT",
  properties: {
    category: { type: "STRING" }, // "PREP", "DRYER", "KCS"
    metrics: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" }, // vd: "lucBe", "doDay", "tyTrong"...
          label: { type: "STRING" }, // vd: "Lực bẻ thực tế"
          target: { type: "NUMBER" },
          unit: { type: "STRING" }
        }
      }
    },
    thermal_zones: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" }, // vd: "M21", "Zone 1"
          pv: { type: "NUMBER" },
          sv: { type: "NUMBER" },
          side: { type: "STRING" }, // "Trái" hoặc "Phải" hoặc null
          floor: { type: "NUMBER" } // 1-5 hoặc null
        }
      }
    }
  }
};
