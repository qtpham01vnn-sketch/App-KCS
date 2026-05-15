# Kiến Trúc Hệ Thống - App KCS Industrial AI

Tài liệu này mô tả tổng quan về công nghệ, cấu trúc mã nguồn và lược đồ cơ sở dữ liệu (Database Schema) của ứng dụng App KCS, giúp các kỹ sư tiếp quản dự án dễ dàng nắm bắt.

## 1. Công Nghệ Sử Dụng (Tech Stack)
- **Frontend Framework:** React (khởi tạo qua Vite). 
- **Styling:** Tailwind CSS kết hợp với `framer-motion` cho các hiệu ứng chuyển động mượt mà và giao diện "Glassmorphism" hiện đại, tối.
- **Icon:** `lucide-react`.
- **Database / Backend:** Supabase (PostgreSQL) để lưu trữ các báo cáo kiểm định mẻ nung thời gian thực.
- **AI Engine:** Google Generative AI (Model: `gemini-flash-latest`) dùng cho nhận dạng OCR quang học các màn hình HMI phức tạp.

## 2. Cấu Trúc Mã Nguồn (Project Structure)
Các file mã nguồn quan trọng nằm trong thư mục `src/`:

- `src/App.jsx`: Thành phần UI chính, chứa toàn bộ trạng thái (state) ứng dụng, luồng người dùng 4 bước, bảng điều khiển (Dashboard) và logic tương tác với Supabase.
- `src/lib/gemini.js`: Trái tim AI của ứng dụng. Quản lý việc khởi tạo SDK Google Generative AI, chuyển đổi ảnh HMI thành base64, và gửi đi kèm với Lệnh Hệ Thống (System Prompt) để nhận về dữ liệu JSON.
- `src/lib/constants.js`: "Bộ não nghiệp vụ" lưu trữ:
  - `PRODUCTS`: Danh sách mã gạch sản xuất.
  - `KILN_RULES`: Các quy tắc tắt/bật dải nhiệt tương ứng theo từng mã gạch và loại lò.
  - `SYSTEM_PROMPT_V737`: Câu lệnh điều khiển siêu chi tiết bắt ép AI trích xuất dữ liệu không sai lệch.
  - `SCHEMA_OCR`: Lược đồ JSON ép buộc định dạng đầu ra của AI (Structured Output).
- `src/lib/supabase.js`: Khởi tạo kết nối tới Supabase thông qua `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.

### Các trang chính (`src/pages/`):
- `src/pages/Dashboard.jsx`: Bảng điều khiển tổng quan, hiển thị số lượng mẻ, AI Command Center.
- `src/pages/KilnAudit.jsx`: 🔒 Quy trình đối soát Lò Nung 4 bước (Lab → Ảnh → AI → Lưu).
- `src/pages/DryerAudit.jsx`: 🔒 Quy trình đối soát Lò Sấy 5 tầng (120 điểm nhiệt).
- `src/pages/Comparison.jsx`: 🔒 So sánh dải nhiệt song song (Mẻ A vs Mẻ B) + Xuất PDF so sánh.
- `src/pages/DatabaseView.jsx`: 🔒 Thư viện Cloud, xem chi tiết mẻ, xuất PDF/Excel.
- `src/pages/Settings.jsx`: Cài đặt hệ thống — 5 tab (Hồ sơ, Nhân sự, Bảo mật, Thông báo, Dữ liệu) + Reset dữ liệu.
- `src/pages/KnowledgeBase.jsx`: Kho Tri Thức — Upload/Quản lý tài liệu ISO, kỹ thuật ngành. Trích xuất PDF bằng `pdfjs-dist`. Lưu trữ **Supabase Cloud** (bảng `knowledge_docs`). Tài liệu đồng bộ giữa các máy trạm.

### Các component (`src/components/`):
- `src/components/LoginGate.jsx`: Màn hình đăng nhập + toàn bộ logic auth (localStorage). Chứa các hàm: `initAuth`, `login`, `logout`, `requestAccess`, `approveRequest`, `rejectRequest`, `changeAdminPassword`, `resetAdminPassword`.
- `src/components/Sidebar.jsx`: Menu điều hướng bên trái (7 menu items, version v1.2.0).
- `src/components/Header.jsx`: Header hiển thị tên/vai trò người đăng nhập (nhận prop `currentUser`).

### Kiến trúc AI (`src/lib/gemini.js`) — 2 HÀM TÁCH BIỆT:
⚠️ **QUAN TRỌNG**: File `gemini.js` chứa 2 hàm hoàn toàn độc lập:

| Hàm | Model | Dùng bởi | Mục đích |
|-----|-------|----------|----------|
| `runOCR()` | `gemini-flash-latest` | KilnAudit + DryerAudit (🔒 LOCKED) | Trích xuất ảnh HMI → JSON |
| `chatWithData()` | `gemini-2.5-flash` | Dashboard (Chatbot) | Hỏi đáp chuyên gia AI |

Khi sửa chatbot → chỉ sửa `chatWithData()`. TUYỆT ĐỐI KHÔNG đụng `runOCR()`.

## 3. Lược Đồ Cơ Sở Dữ Liệu (Database Schema)
Toàn bộ dữ liệu kiểm soát mẻ nung được lưu tại bảng `kiln_dryer_reports` trên Supabase.

### Cấu trúc Bảng `kiln_dryer_reports`:
| Tên Cột | Kiểu Dữ Liệu | Chú Thích |
|---|---|---|
| `id` | UUID | Khóa chính tự sinh |
| `created_at` | Timestamp | Thời gian mẻ nung được ghi nhận |
| `batch_code` | Text | Mã mẻ nung (Tạo tự động bằng Tên gạch + Timestamp để tránh trùng lặp) |
| `product_type` | Text | Tên mã gạch (vd: CERAMIC ốp 40X80) |
| `kiln_type` | Text | Loại lò (Lò Xương / Lò Men) |
| `lab_info` | JSONB | Lưu toàn bộ thông tin chỉ số phòng Lab (Lực bẻ, độ dày, bền uốn, hút nước, bài phối liệu...) |
| `strength_value` | Float | Lực bẻ (để tra cứu nhanh trên Dashboard) |
| `moisture_percent` | Float | Độ ẩm (nếu có) |
| `kiln_data` | JSONB | Data HMI đã được lọc qua quy tắc KILN_RULES (chỉ chứa các khoang hoạt động) |
| `raw_ai_response` | JSONB | Data HMI gốc trả về từ AI (chứa tất cả các khoang để back-up / audit lại AI) |

## 4. Quản Lý Biến Môi Trường (.env)
Bắt buộc phải cấu hình đúng file `.env` tại gốc dự án:
```env
VITE_SUPABASE_URL=https://[YOUR_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
VITE_GEMINI_API_KEY=AIzaSy...
# Bắt buộc để trống VITE_GEMINI_BASE_URL để sử dụng máy chủ chuẩn của Google.
VITE_GEMINI_BASE_URL=""
```
