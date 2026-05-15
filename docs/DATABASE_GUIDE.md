# 🗄️ Cấu trúc Dữ liệu & Lưu trữ (Supabase)

## 1. Bảng `kiln_dryer_reports`
Toàn bộ dữ liệu được lưu trữ tập trung tại bảng này.

| Trường | Kiểu dữ liệu | Ý nghĩa |
|--------|--------------|---------|
| `batch_code` | Text | Mã mẻ nung / Tên sản phẩm |
| `product_type` | Text | Loại gạch (ốp/lát) |
| `kiln_type` | Text | Lò Men / Lò Xương |
| `lab_info` | JSON | Thông tin ca trực, lực bẻ, độ dày... |
| `kiln_data` | JSON | Dữ liệu HMI đã trích xuất (Nhiệt độ, Quạt, Áp suất) |
| `created_at` | Timestamp | Thời điểm lưu mẻ |

## 2. Cơ chế So sánh
Hệ thống sử dụng ID của 2 mẻ nung khác nhau để thực hiện truy vấn song song:
- `Delta = |PV_Mẻ_A - PV_Mẻ_B|`
- **Ngưỡng cảnh báo**: > 5°C.

## 3. Bảo mật
API Key và URL của Supabase được quản lý qua biến môi trường `.env` để đảm bảo an toàn.
