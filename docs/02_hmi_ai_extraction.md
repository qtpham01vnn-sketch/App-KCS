# Hướng Dẫn Kỹ Thuật Trích Xuất AI HMI Modena

Tài liệu này ghi lại những quy luật "sống còn" đã được cấu hình trong Hệ thống AI (`src/lib/constants.js` - biến `SYSTEM_PROMPT_V737`) để giúp Gemini 1.5 Flash đọc chuẩn xác dữ liệu từ bảng HMI Modena của nhà máy. Bất kỳ sự thay đổi nào đối với file này cũng cần phải tham khảo tài liệu này.

## 1. Cấu Trúc Bảng HMI Modena
Màn hình điều khiển được chia làm 2 hàng đồng hồ chính, ngăn cách bởi sơ đồ thiết kế lò nằm ở giữa:
- **Hàng Trên (Tier 1):** Nằm cao nhất, phía trên sơ đồ lò. Các nhãn ID của hàng này **không có số 0** ở giữa (M21, M25, M27... M63).
- **Hàng Dưới (Tier 3):** Nằm thấp nhất, phía dưới sơ đồ lò. Các nhãn ID của hàng này **có số 0** ở giữa tương ứng (M021, M025, M027... M063).

> **Lưu ý Đặc biệt (Khu vực M45-M63):** Dù nhìn từ xa có cảm giác chúng chỉ có 1 hàng ở cuối, nhưng thực chất chúng vẫn phân làm 2 hàng trên-dưới sơ đồ lò. Cần tuyệt đối không nhầm lẫn chúng bị gộp làm một.

## 2. Các Chứng Bệnh Thường Gặp Của AI & Cách Khắc Phục (Prompt Engineering)

### Bệnh 1: Nhảy mảng hàng ngang (Horizontal Shifting)
**Triệu chứng:** Giá trị SV của khoang M027 bị gán nhầm cho M025, M029 gán cho M027... Toàn bộ mảng SV bị giật lùi về bên trái 1 nhịp.
**Nguyên nhân gốc rễ:** Bản năng của mô hình AI Vision là đọc văn bản (và chữ số) theo dòng kẻ ngang từ trái qua phải. Khi quét hàng SV màu xanh lá ở dưới, nếu có một con số bị mờ hoặc quá nhỏ (ví dụ số `27` ở M025), AI tự động bỏ qua nó và chắp nối con số SV hợp lệ tiếp theo (800 của M027) lên vị trí bị thiếu.
**Cách xử lý dứt điểm trong Prompt:**
- **Ép buộc quét theo CỘT DỌC (Column-by-column):** Ra lệnh cho AI "KHÔNG ĐƯỢC ĐỌC THEO HÀNG NGANG". Ép nó phải di chuyển theo thứ tự: Đọc M21 -> M021 -> M25 -> M025...
- Bằng cách này, AI tạo ra một bounding-box vô hình quanh 2 đồng hồ trên/dưới. Nếu đồng hồ bị thiếu số, nó bị kẹt trong bounding box đó và buộc phải xuất ra `"N/A"`, không được phép mượn số của cụm bên cạnh.

### Bệnh 2: Ảo giác lấy số mờ
**Triệu chứng:** SV của các khoang đầu lò (M21 - M27) thường hiện chữ mã "P 12", "P 27" (chỉnh tỷ lệ Gas) hoặc một con số cực nhỏ thay vì nhiệt độ. AI đôi khi cố nặn ra nhiệt độ từ đám mờ đó.
**Cách xử lý:** 
- Áp dụng quy tắc N/A cứng: *"Từ M21 đến M27, nếu số Xanh (SV) là chữ hoặc số nhỏ (<100) thì BẮT BUỘC ghi SV của đồng hồ đó là N/A".* Từ M29 trở đi mới bắt đầu lấy số Xanh bình thường.

### Bệnh 3: Bỏ sót thông số Áp Suất & Quạt
**Triệu chứng:** Bỏ dấu âm (-) hoặc vứt dấu chấm thập phân (.) của áp suất. Lấy nhầm đơn vị dòng điện (Ampe - A) của quạt.
**Cách xử lý:**
- Nhấn mạnh: *"Phải giữ nguyên dấu trừ (-) và dấu chấm (.) (vd: -21.6, 3.5)."*
- Yêu cầu AI chỉ quét tần số (Hz) cho quạt: *"CHỈ LẤY SỐ TRÊN CÙNG (CÓ CHỮ HZ BÊN CẠNH). Tuyệt đối không lấy dòng V hay A."*

## 3. Cấu Trúc JSON Đầu Ra (Structured Output)
Google Generative AI SDK được cấu hình `responseSchema = SCHEMA_OCR` nhằm loại bỏ hoàn toàn các ký tự linh tinh (như Markdown ` ```json `), ép AI trả về dữ liệu đúng chuẩn JSON nguyên gốc để Parse thẳng vào React.

Dữ liệu Nhiệt độ trả về nằm trong mảng `nhietDo`, gồm một danh sách phẳng các Object:
```json
{
  "id": "M25",
  "pv": "660",
  "sv": "N/A"
}
```
Front-end (file `App.jsx`) sau đó sẽ có nhiệm vụ nhóm các mã bắt đầu bằng `M0...` xuống hàng Dưới và mã không có số 0 lên hàng Trên để hiển thị bảng đối soát.
