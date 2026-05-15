# Quy Tắc Phát Triển & Bảo Trì (VÀNG)

⚠️ **QUAN TRỌNG**: Để đảm bảo tính ổn định của hệ thống đã được anh duyệt, bất kỳ kỹ sư nào tiếp nhận dự án này PHẢI tuân thủ các quy tắc sau:

## 1. Các Module Đã Khóa (Lock Tags — 8 TAG)
Không được tự ý sửa đổi code logic của các phần sau đây khi chưa có sự đồng ý của Anh:
- **TAG 1 — Trích xuất Lò Nung** (`KilnAudit.jsx`): Logic nhận diện PV/SV và các khoang bị loại bỏ.
- **TAG 2 — Trích xuất Lò Sấy** (`DryerAudit.jsx`): Cấu trúc lưới 120 điểm nhiệt và heatmap.
- **TAG 3 — Cơ sở dữ liệu & Xuất PDF** (`DatabaseView.jsx`): Logic hiển thị, tìm kiếm, xuất PDF/Excel.
- **TAG 4 — So sánh dải nhiệt** (`Comparison.jsx`): Logic lọc, so sánh song song Mẻ A/B, tính Delta, xuất PDF so sánh.
- **TAG 5 — Cài đặt hệ thống** (`Settings.jsx` + `LoginGate.jsx`): Đăng nhập, phân quyền, quản trị nhân sự, 5 tab.
- **TAG 6 — Kho Tri Thức** (`KnowledgeBase.jsx`): Upload PDF/TXT, đọc bằng pdfjs-dist, lưu Supabase Cloud.
- **TAG 7 — Nguyên liệu & Phối liệu** (`MaterialManager.jsx`): Logic bóc tách mẻ nghiền xương/men.
- **TAG 8 — Kiểm soát Hồ & Bột** (`QualityControl.jsx`): Logic đồng bộ 4 bảng số liệu KCS ca trực.

## 2. Quy tắc thẩm mỹ (Visual Standards)
- Luôn giữ phong cách Dark Mode cao cấp.
- Sử dụng màu xanh Emerald làm điểm nhấn chính.
- Không được làm mất hiệu ứng Glassmorphism khi thêm tính năng mới.

## 3. Quản lý lỗi (Error Handling)
- **Ngày tháng**: Luôn sử dụng bộ lọc xử lý "Invalid Date" để tránh làm xấu giao diện.
- **Dữ liệu trống**: Hiển thị "---" cho các giá trị không trích xuất được, không để trống ô.

## 4. Bảo mật
- Tuyệt đối không đẩy file `.env` lên Github hoặc các kho lưu trữ công cộng.
- Luôn sử dụng mã hóa Base64 cho các dữ liệu nhạy cảm khi cần thiết.

## 5. Hệ thống Đăng nhập & Phân quyền
- **File chính**: `src/components/LoginGate.jsx` (auth logic) + `src/pages/Settings.jsx` (quản trị UI).
- **Lưu trữ auth**: localStorage (keys: `kcs_auth_users`, `kcs_auth_session`, `kcs_auth_pending`, `kcs_admin_profile`).
- **Tài khoản Admin mặc định**: `admin` / `phuongnam2026` — hàm `initAuth()` tự bảo vệ nếu admin bị mất.
- **2 vai trò**: `admin` (toàn quyền) và `viewer` (chỉ xem).
- **6 phòng ban hỗ trợ**: Phòng KCS, Phòng Lab, Phòng Công nghệ, Ban Tổng giám đốc, PXSX, PXCĐ-NL.
- **Khi thêm phòng ban mới**: Cập nhật ở CẢ 2 nơi — `LoginGate.jsx` (form yêu cầu) và `Settings.jsx` (dropdown hồ sơ).

## 6. Kiến trúc AI — 2 Hàm Tách Biệt trong `gemini.js`
⚠️ **QUAN TRỌNG NHẤT**: File `src/lib/gemini.js` chứa 2 hàm HOÀN TOÀN ĐỘC LẬP:
- **`runOCR()`** (dòng 7-49) → Model `gemini-flash-latest` → Phục vụ Lò Nung + Lò Sấy (🔒 LOCKED) → **TUYỆT ĐỐI KHÔNG SỬA**.
- **`chatWithData()`** (dòng 51+) → Model `gemini-2.5-flash` → Phục vụ Chatbot Dashboard → Được phép sửa.
- **Khi cần sửa chatbot**: CHỈ sửa `chatWithData()`. Nếu sửa nhầm `runOCR()` sẽ phá hỏng 2 TAG Lò Nung/Lò Sấy.

## 7. Kho Tri Thức (`KnowledgeBase.jsx`)
- **Lưu trữ**: localStorage (key: `kcs_knowledge_docs`).
- **Giới hạn file upload**: 500KB text, hỗ trợ .txt / .md / .pdf.
- **6 danh mục**: ISO & Tiêu chuẩn, Kỹ thuật Ceramic, Văn bản hành chính, Quy trình sản xuất, Lỗi & Khắc phục, Khác.
- **Kết nối Chatbot**: Dashboard import `getKnowledgeDocs()` từ KnowledgeBase → truyền cho `chatWithData()`.
- **Phân quyền**: Admin (upload + xóa), Viewer (chỉ xem danh sách).
