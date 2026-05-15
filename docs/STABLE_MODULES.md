# Danh Sách Module Ổn Định (Stable Modules) — LOCKED 🔒

Tài liệu này ghi chép các Module (TAG) đã hoàn thiện 100% về mặt logic và giao diện, đã được Anh duyệt và **KHÓA** để làm nền tảng phát triển.

## 1. Lò Nung Men/Xương (`KilnAudit.jsx`)
*   **Chức năng**: Ghi chép thông số kỹ thuật 30 zone nhiệt độ PV/SV, áp suất và quạt.
*   **AI OCR**: Trích xuất từ ảnh chụp màn hình HMI lò nung Modena.
*   **Trạng thái**: 🔒 LOCKED.

## 2. Lò Sấy 5 Tầng (`DryerAudit.jsx`)
*   **Chức năng**: Kiểm soát 120 điểm nhiệt độ trên 5 tầng sấy.
*   **AI OCR**: Trích xuất dữ liệu từ bảng điều khiển lò sấy.
*   **Trạng thái**: 🔒 LOCKED.

## 3. Cơ sở dữ liệu (`DatabaseView.jsx`)
* - [x] **Machine Manager (MMTB)**: Reorganized into 9 areas, stable grouping and status.
- [x] **Department ISO Management**: Full CRUD, Storage integration, Online Office Preview.
*   **Trạng thái**: 🔒 LOCKED.

## 4. So sánh dải nhiệt (`Comparison.jsx`)
*   **Chức năng**: So sánh 2 mẻ bất kỳ, tính toán Delta độ lệch nhiệt độ (Cảnh báo đỏ > 5°C).
*   **Xuất bản**: In báo cáo so sánh PDF.
*   **Trạng thái**: 🔒 LOCKED.

## 5. Cài đặt hệ thống (`Settings.jsx`)
*   **Chức năng**: Quản trị nhân sự, phân quyền Admin/Viewer, duyệt yêu cầu truy cập.
*   **Bảo mật**: Login Gate (Glassmorphism), Reset dữ liệu an toàn.
*   **Trạng thái**: 🔒 LOCKED.

## 6. Kho Tri Thức (`KnowledgeBase.jsx`)
*   **Chức năng**: Lưu trữ ISO, Tiêu chuẩn kỹ thuật (.pdf, .txt, .md, .xlsx, .docx).
*   **Version 2.0**: Hỗ trợ tải hàng loạt file, tải cả thư mục, xem file gốc qua Microsoft Viewer.
*   **AI Search**: Chatbot tự tìm kiếm kiến thức từ kho để trả lời câu hỏi kỹ thuật.
*   **Trạng thái**: 🔒 LOCKED (v2.1.0).

## 7. Nguyên liệu & Phối liệu (`MaterialManager.jsx`)
*   **Chức năng**: Quản lý mẻ nghiền Bi, bài phối liệu Xương/Men.
*   **Đặc tính**: Số mẻ tự do (15/04), hỗ trợ dán ảnh (Ctrl+V) ổn định.
*   **AI OCR**: `runGrindingOCR` (Gemini Flash).
*   **Trạng thái**: 🔒 LOCKED.

## 8. Kiểm soát Hồ & Bột (`QualityControl.jsx`)
*   **Chức năng**: Nhật ký báo cáo ca (Day/Night) cho Hồ Xương, Hồ Men, Bột Sấy, Bột Ép.
*   **Đặc tính**: Giao diện bảng compact, trích xuất đa dòng (Multi-row).
*   **AI OCR**: `runQualityOCR` (Gemini Flash).
*   **Trạng thái**: 🔒 LOCKED.

---
**Ghi chú**: Mọi thay đổi vào các file trên đều phải có sự xác nhận từ Ban TGĐ/Phòng Công nghệ.
