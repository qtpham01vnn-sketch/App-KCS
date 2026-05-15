# Cấu Trúc Cơ Sở Dữ Liệu & Cloud

## 1. Nền tảng: Supabase
Hệ thống sử dụng Supabase (PostgreSQL) để lưu trữ dữ liệu thời gian thực.

## 2. Bảng dữ liệu chính: `kiln_data_logs`
Đây là "trái tim" của hệ thống lưu trữ, bao gồm các trường:
- `id`: Định danh duy nhất (UUID).
- `product_type`: Tên sản phẩm.
- `batch_code`: Mã mẻ sản xuất (Batch ID).
- `kiln_type`: Loại thiết bị ('Lò Nung' hoặc 'Lò Sấy').
- `strength_value`: Giá trị Lực bẻ (Kiln) hoặc Độ ẩm (Dryer).
- `lab_info`: Chứa toàn bộ thông tin Lab (JSONB).
- `kiln_data`: Chứa dữ liệu nhiệt độ chi tiết, quạt, áp suất (JSONB).
- `image_url`: Link ảnh gốc đã chụp màn hình (để đối soát khi cần).

## 3. Quản lý ảnh (Storage)
Ảnh chụp màn hình HMI được tải lên Supabase Storage (Bucket: `kiln-images`) trước khi trích xuất. Link ảnh được lưu kèm bản ghi dữ liệu.

## 4. Bảo mật dữ liệu
Toàn bộ kết nối đến Cloud được bảo vệ bằng các biến môi trường (`.env`), không công khai API Key ra ngoài.
