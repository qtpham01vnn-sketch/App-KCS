# Lộ Trình Phát Triển & Lịch Sử Nâng Cấp (Roadmap)

## 1. Các cột mốc đã hoàn thành — Giai đoạn V1.0 (Nền tảng)
Hệ thống đã hoàn tất giai đoạn xây dựng nền tảng với các tính năng:
- [x] **V1.0.1**: Hoàn thiện AI trích xuất Lò Nung (Loại bỏ M7-M20).
- [x] **V1.0.2**: Triển khai Lò Sấy 5 tầng + Lưới 120 điểm nhiệt.
- [x] **V1.0.3**: Kết nối Supabase Cloud & State Persistence (Giữ dữ liệu khi chuyển Tab).
- [x] **V1.0.4**: Nâng cấp Xuất PDF chuyên nghiệp (HTML Preview).
- [x] **V1.0.5**: Hoàn thiện Xuất Google Sheets (Quick Copy Method).
- [x] **V1.0.6**: Hệ thống tài liệu hóa kỹ thuật (docs/).
- [x] **V1.0.7**: Hiển thị số phiên bản v1.0.1 trên Sidebar.

## 2. Các cột mốc đã hoàn thành — Giai đoạn V1.1 (So sánh & Phân tích)
- [x] **V1.1.0**: Xây dựng trang "So sánh dải nhiệt" (`src/pages/Comparison.jsx`).
  - Bộ lọc đa tầng: Ngày tháng, Loại sản phẩm, Loại lò.
  - 2 Dropdown chọn Mẻ chuẩn (A) và Mẻ so sánh (B).
  - Hiển thị song song 100% thông số: Lab, Bài phối liệu, Nhiệt độ PV/SV (Trên/Dưới), Quạt (Hz), Áp suất (Pa).
  - Cột Delta tự động tính toán độ lệch, cảnh báo đỏ khi > 5°C.
- [x] **V1.1.1**: Xuất PDF báo cáo so sánh dải nhiệt (HTML Preview, nút In/Lưu PDF).
  - Báo cáo song song Mẻ A vs Mẻ B đầy đủ thông số.
  - Bảng Delta (A - B) highlight đỏ/xanh theo ngưỡng 5°C.
- [x] **V1.1.2**: Tích hợp `Comparison.jsx` vào hệ thống điều hướng `App.jsx`.

## 3. Các cột mốc đã hoàn thành — Giai đoạn V1.2 (Đăng nhập & Phân quyền)
- [x] **V1.2.0**: Xây dựng màn hình Đăng nhập (`src/components/LoginGate.jsx`).
  - Giao diện login Dark Glassmorphism với logo Phương Nam.
  - Tài khoản Admin mặc định: `admin` / `phuongnam2026`.
  - Chặn autofill trình duyệt (autocomplete="off").
  - Hàm `initAuth()` tự bảo vệ — nếu admin bị mất sẽ tự tạo lại.
- [x] **V1.2.1**: Hệ thống Yêu cầu truy cập (Request Access).
  - Người dùng mới bấm "Yêu cầu quyền truy cập" → Nhập Họ tên + Phòng ban.
  - 6 phòng ban: Phòng KCS, Phòng Lab, Phòng Công nghệ, Ban TGĐ, PXSX, PXCĐ-NL.
  - Yêu cầu hiện trong tab "Thông báo" (badge đỏ) cho Admin duyệt.
- [x] **V1.2.2**: Phân quyền Admin / Viewer.
  - Admin: Toàn quyền (Quản trị nhân sự, Thông báo, Reset dữ liệu).
  - Viewer: Chỉ xem (không thấy tab Quản trị, Thông báo, Reset).
- [x] **V1.2.3**: Nâng cấp trang Cài đặt hệ thống (`src/pages/Settings.jsx`) — 5 tab hoạt động:
  - Hồ sơ cá nhân (lưu localStorage, cập nhật Header ngay lập tức).
  - Quản trị nhân sự (danh sách user, xóa user — Admin only).
  - Bảo mật & Quyền (đổi mật khẩu Admin).
  - Thông báo (duyệt/từ chối yêu cầu truy cập, cấp tài khoản — Admin only).
  - [x] **ISO Document Management (v1.5)**
    - [x] Multi-department structure (8+1 Depts)
    - [x] Supabase Storage integration for ISO docs
    - [x] Online Office Preview ("Con mắt thần")
    - [x] Full UI-based CRUD for ISO structure
  - [x] **Machine Manager (MMTB v1.1)**
    - [x] Reorganized 9 industrial areas
    - [x] Integrated status monitoring
    - [x] Dynamic grouping accordion
- [x] **V1.2.4**: Khu vực Reset dữ liệu với Modal xác nhận (gõ "XÓA TẤT CẢ").
- [x] **V1.2.5**: Nút Đăng xuất + Header hiển thị tên/vai trò người đang đăng nhập.

## 4. Trạng Thái Khóa Module (4 TAG ĐÃ KHÓA — LOCKED ✅)
⚠️ **QUAN TRỌNG**: 4 TAG sau đây đã được Anh duyệt và KHÓA hoàn toàn. Tuyệt đối không sửa đổi code logic khi chưa được phê duyệt:

| # | TAG | File chính | Trạng thái |
|---|-----|-----------|------------|
| 1 | **Lò Nung Men/Xương** | `src/pages/KilnAudit.jsx` | 🔒 LOCKED |
| 2 | **Lò Sấy 5 Tầng** | `src/pages/DryerAudit.jsx` | 🔒 LOCKED |
| 3 | **Cơ sở dữ liệu** | `src/pages/DatabaseView.jsx` | 🔒 LOCKED |
| 4 | **So sánh dải nhiệt** | `src/pages/Comparison.jsx` | 🔒 LOCKED |

> 📌 TAG "Cài đặt hệ thống" (`Settings.jsx` + `LoginGate.jsx`) đang hoạt động ổn định nhưng **CHƯA KHÓA** — vẫn tiếp tục cải tiến theo yêu cầu Anh.

## 5. Các cột mốc đã hoàn thành — Giai đoạn V1.3 (AI Chatbot & Kho Tri Thức)
- [x] **V1.3.0**: Nâng cấp AI Chatbot (Dashboard → AI Command Center).
  - Đổi model từ `gemini-1.5-flash` (deprecated) → `gemini-2.5-flash` (model mới nhất).
  - Chỉ sửa hàm `chatWithData()` — hàm `runOCR()` (phục vụ 4 TAG khóa) giữ nguyên 100%.
  - Smart Log Search: Lọc mẻ liên quan theo từ khóa câu hỏi thay vì gửi 15 mẻ ngẫu nhiên.
  - Gửi đầy đủ thông số mẻ: product, kiln, batch, strength, benUon, doDay, hutNuoc, baiXuong, baiMen, thermal (30 zone PV/SV).
- [x] **V1.3.1**: Mega System Prompt (~2000 từ) — Kiến thức cứng tích hợp:
  - ISO 10545 (24 phần, chi tiết từng phần 1-12).
  - ISO 13006 (phân loại BIa/BIb/BIIa/BIIb/BIII).
  - ISO 9001:2015, ISO 14001:2015, TCVN 7745:2007.
  - Quy trình sản xuất gạch men 7 bước (Nghiền bi → Phân loại).
  - 9 lỗi thường gặp + cách khắc phục (nứt mộc, cong vênh, phồng rộp, sai màu, pinhole...).
  - Kiến thức Lò Nung Modena (zone, PV/SV, quạt, áp suất).
  - Kiến thức Lò Sấy 5 tầng (120 điểm nhiệt).
- [x] **V1.3.2**: Tạo TAG "Kho Tri Thức" (`src/pages/KnowledgeBase.jsx`).
  - Upload tài liệu .txt / .md / .pdf.
  - 6 danh mục: ISO & Tiêu chuẩn, Kỹ thuật Ceramic, Văn bản hành chính, Quy trình sản xuất, Lỗi & Khắc phục, Khác.
  - Danh sách tài liệu (tên, loại, ngày, kích thước) + Xem nội dung (panel phải).
  - Lưu trữ localStorage (key: `kcs_knowledge_docs`).
  - Phân quyền: Admin upload/xóa, Viewer chỉ xem.
- [x] **V1.3.3**: Kết nối Kho Tri Thức → Chatbot.
  - Dashboard tự đọc tài liệu từ Supabase khi gửi câu hỏi.
  - AI tự tìm tài liệu liên quan theo từ khóa, gửi tối đa 3 tài liệu cho Gemini.
- [x] **V1.3.4**: Cập nhật Sidebar: Thêm menu "Kho Tri Thức" (icon BookOpen), version v1.2.0.
- [x] **V1.3.5**: Tích hợp route KnowledgeBase vào `App.jsx`.
- [x] **V1.3.6**: Nâng cấp Kho Tri Thức — PDF + Supabase Cloud.
  - Cài `pdfjs-dist` (Mozilla) — đọc PDF text chuẩn xác, tiếng Việt có dấu.
  - Chuyển lưu trữ từ localStorage → Supabase Cloud (bảng `knowledge_docs`).
  - Tăng giới hạn file: 500KB → 20MB.
  - Thanh tiến trình khi trích xuất PDF.
  - **Kết nối Cloud**: Tài liệu đồng bộ giữa nhiều thiết bị, chatbot truy cập trực tiếp từ Cloud.


## 7. Các cột mốc đã hoàn thành — Giai đoạn V2.0 (Quản trị Sản xuất KCS)
- [x] **V2.0.0**: Xây dựng TAG "Nguyên liệu & Phối liệu" (`src/pages/MaterialManager.jsx`).
  - AI OCR trích xuất thông số mẻ nghiền Xương/Men.
  - Hỗ trợ số mẻ định dạng tự do (ví dụ: 15/04).
  - Cơ chế Drag & Drop + Paste (Ctrl+V) ổn định 100%.
- [x] **V2.0.1**: Xây dựng TAG "Kiểm soát Hồ & Bột" (`src/pages/QualityControl.jsx`).
  - Giao diện Báo cáo Ca 4 khối (Hồ Xương, Hồ Men, Bột Sấy, Bột Ép).
  - AI OCR trích xuất đa dòng (Multi-row) theo khung giờ cho cả ca 12 tiếng (Ca Ngày/Đêm).
  - Tối ưu cột chỉ tiêu hạt: >0.6, >0.45, 0.125-0.6, <0.125.
  - Giao diện compact, cân đối, hỗ trợ quản lý dữ liệu lớn trên một màn hình.

## 8. Các cột mốc đã hoàn thành — Giai đoạn V2.1 (Kho Tri Thức 2.0)
- [x] **V2.1.0**: Nâng cấp Kho Tri Thức 2.0 (Toàn diện & Siêu tốc).
  - **Batch Upload**: Tải lên hàng chục file cùng lúc (.pdf, .xlsx, .docx, .txt, .md).
  - **Folder Upload**: Hỗ trợ chọn cả thư mục (webkitdirectory) tự động quét file.
  - **O1R Microsoft Viewer**: Tích hợp bộ đọc Microsoft Office Online cho Excel/Word cực kỳ ổn định.
  - **External Link (Emerald)**: Nút mở file nhanh ra tab mới ngay tại danh sách tài liệu.
  - **Clean AI Data**: Xây dựng hàm `cleanExtractedText` xóa sạch dấu `|` và `---` nhiễu bảng biểu, giúp dữ liệu AI sạch sẽ 100%.
  - **Cloud Persistence**: Đồng bộ hoàn hảo giữa Supabase Storage (iso-documents) và Database.

## 8. Trạng Thái Khóa Module (8 TAG ĐÃ KHÓA — LOCKED ✅)
⚠️ **QUAN TRỌNG**: 8 TAG sau đây đã được Anh duyệt và KHÓA hoàn toàn. Tuyệt đối không sửa đổi code logic khi chưa được phê duyệt:

| # | TAG | File chính | Trạng thái |
|---|-----|-----------|------------|
| 1 | **Lò Nung Men/Xương** | `src/pages/KilnAudit.jsx` | 🔒 LOCKED |
| 2 | **Lò Sấy 5 Tầng** | `src/pages/DryerAudit.jsx` | 🔒 LOCKED |
| 3 | **Cơ sở dữ liệu** | `src/pages/DatabaseView.jsx` | 🔒 LOCKED |
| 4 | **So sánh dải nhiệt** | `src/pages/Comparison.jsx` | 🔒 LOCKED |
| 5 | **Cài đặt hệ thống** | `src/pages/Settings.jsx` + `src/components/LoginGate.jsx` | 🔒 LOCKED |
| 6 | **Kho Tri Thức** | `src/pages/KnowledgeBase.jsx` | 🔒 LOCKED |
| 7 | **Nguyên liệu & Phối liệu** | `src/pages/MaterialManager.jsx` | 🔒 LOCKED |
| 8 | **Kiểm soát Hồ & Bột** | `src/pages/QualityControl.jsx` | 🔒 LOCKED |

> 📌 AI Chatbot (`Dashboard.jsx` + `gemini.js:chatWithData`) — Hoạt động ổn định, **CHƯA KHÓA**.

## 9. Dự kiến nâng cấp tiếp theo (Future Roadmap)
- [ ] **Dashboard Phân tích Tổng hợp**: Biểu đồ so sánh chất lượng hồ/bột giữa các ca làm việc.
- [ ] **Cảnh báo Thông số Lệch chuẩn**: AI tự động phát hiện số liệu KCS nằm ngoài ngưỡng cho phép.
- [ ] **Báo cáo Lò Nung Phase 2**: Tối ưu hóa việc ghi nhận thông số lò nung kết hợp dữ liệu chất lượng từ Lab.
- [ ] **Mobile App**: Giao diện tối ưu cho điện thoại để xem báo cáo mọi lúc mọi nơi.

