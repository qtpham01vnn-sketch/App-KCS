# Tổng Quan Ứng Dụng: Phuong Nam Smart KCS AI

## 1. Mục tiêu và Ý nghĩa
Hệ thống được thiết kế để tự động hóa quy trình kiểm tra chất lượng (KCS) tại nhà máy sản xuất gạch/gốm sứ. Thay vì nhập liệu thủ công từ màn hình HMI của các thiết bị (Lò nung, Lò sấy), ứng dụng sử dụng AI để trích xuất dữ liệu trực tiếp từ hình ảnh chụp màn hình, đảm bảo tính chính xác 100% và tốc độ xử lý vượt trội.

## 2. Các phân hệ chính
- **Lò Nung Men/Xương**: Trích xuất dải nhiệt độ PV/SV, áp suất và trạng thái các quạt.
- **Lò Sấy 5 Tầng**: Trích xuất lưới nhiệt độ khổng lồ gồm 120 điểm nhiệt, quạt dẫn động và các thông số kỹ thuật đặc thù.
- **So sánh dải nhiệt**: Đối soát song song 2 mẻ nung (Mẻ chuẩn A vs Mẻ so sánh B) với 100% thông số — Lab, Phối liệu, Nhiệt độ, Quạt, Áp suất. Tự động tính Delta và cảnh báo lệch > 5°C. Hỗ trợ xuất PDF báo cáo so sánh.
- **Cơ sở dữ liệu (Cloud)**: Lưu trữ lâu dài toàn bộ lịch sử trích xuất lên Supabase, cho phép truy xuất và so sánh mẻ nung bất cứ lúc nào.
- **Hệ thống báo cáo**: Xuất báo cáo PDF chuyên nghiệp (không lỗi font) và xuất dữ liệu sang Google Sheets để phân tích sâu.
- **Đăng nhập & Phân quyền**: Hệ thống xác thực localStorage với 2 vai trò (Admin/Viewer). Admin duyệt yêu cầu truy cập, cấp tài khoản, quản lý nhân sự. Viewer chỉ được xem, không được sửa đổi.
- **Cài đặt hệ thống**: 5 tab quản trị (Hồ sơ, Nhân sự, Bảo mật, Thông báo, Dữ liệu hệ thống) + Reset dữ liệu với xác nhận an toàn.
- **AI Chatbot (Command Center)**: Trợ lý AI chuyên gia gạch men tích hợp trong Dashboard. Sử dụng Gemini 2.5 Flash với Mega Prompt chứa kiến thức ISO 10545/13006/9001/14001, quy trình sản xuất, 9 lỗi thường gặp + cách khắc phục. Tìm kiếm thông minh mẻ nung từ DB theo câu hỏi. Kết nối Kho Tri Thức để mở rộng kiến thức.
- **Kho Tri Thức**: Upload tài liệu (.txt/.md/.pdf) phân loại 6 danh mục (ISO, Kỹ thuật, Văn bản hành chính...). AI chatbot tự động tham chiếu khi trả lời. Admin upload/xóa, Viewer chỉ xem.

## 3. Phong cách thiết kế (Aesthetic)
- **Chủ đạo**: Dark Mode (Giao diện tối) cao cấp.
- **Hiệu ứng**: Glassmorphism (Kính mờ), chuyển động mượt mà bằng Framer Motion.
- **Màu sắc thương hiệu**: Xanh Emerald (#10b981) - tượng trưng cho sự chính xác và thông minh của AI.

## 4. Giá trị cốt lõi
"Chính xác - Nhanh chóng - Chuyên nghiệp". Hệ thống không chỉ lưu trữ con số, mà còn lưu trữ cả "tri thức" về quy trình vận hành của nhà máy.

## 5. Trạng thái hiện tại (V1.3)
Hệ thống đã hoàn tất giai đoạn V1.3 và đang vận hành ổn định:
- ✅ TAG 1: Trích xuất Lò Nung & Lò Sấy AI — 🔒 LOCKED.
- ✅ TAG 2: Lò Sấy 5 Tầng (120 điểm nhiệt) — 🔒 LOCKED.
- ✅ TAG 3: Cơ sở dữ liệu Cloud + Xuất PDF/Excel — 🔒 LOCKED.
- ✅ TAG 4: So sánh dải nhiệt song song + Xuất PDF — 🔒 LOCKED.
- ✅ Đăng nhập & Phân quyền (Admin/Viewer) — Hoạt động ổn định.
- ✅ Cài đặt hệ thống (5 tab) — Hoạt động ổn định.
- ✅ AI Chatbot (Gemini 2.5 Flash + Mega Prompt) — Hoạt động ổn định.
- ✅ Kho Tri Thức (Upload tài liệu + Kết nối AI) — Hoạt động ổn định.
