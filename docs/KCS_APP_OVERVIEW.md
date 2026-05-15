# 🏭 App KCS Industrial AI - Tổng quan hệ thống

## 1. Mục tiêu và Ý nghĩa
Ứng dụng được thiết kế riêng cho nhà máy sản xuất gạch Phương Nam, nhằm số hóa quy trình đối soát nhiệt độ lò nung (HMI) vốn trước đây phải ghi chép bằng tay. Sử dụng sức mạnh của AI Vision (Gemini 2.0 Flash) để tự động hóa việc đọc dữ liệu từ ảnh chụp màn hình điều khiển.

## 2. Các tính năng cốt lõi
- **AI OCR HMI**: Trích xuất đồng thời hàng chục thông số Nhiệt độ (PV/SV), Áp suất và Tốc độ quạt từ ảnh chụp thực tế.
- **Đối soát ISO**: Tự động lọc các khoang nhiệt độ theo loại sản phẩm (Gạch lát, Gạch ốp) và kiểm tra tính tuân thủ dải nhiệt.
- **Cơ sở dữ liệu Cloud**: Lưu trữ mẻ nung vào Supabase để tra cứu lịch sử.
- **So sánh dải nhiệt**: Đối chiếu biến thiên (Delta) giữa các mẻ nung để phát hiện sớm các bất thường trong lò.

## 3. Luồng vận hành (Workflow)
1. **Nhập Lab**: Điền thông tin ca trực, loại gạch và lực bẻ.
2. **Chụp ảnh**: Tải lên ảnh màn hình HMI Modena.
3. **AI Vision**: Trích xuất dữ liệu thô và gán vào các Zone (Mxx, M0xx).
4. **Đối soát**: KCS kiểm tra lại tính chính xác.
5. **Lưu trữ**: Bấm "Làm lại" để vừa lưu mẻ cũ, vừa reset cho mẻ mới.

## 4. Nguyên lý thiết kế giao diện
- **Phong cách**: Industrial Dark Mode, Glassmorphism cao cấp.
- **Bố cục**: Ưu tiên tính trực quan cho công nhân vận hành, số to, màu sắc phân biệt rõ rệt (Đỏ - PV, Xanh - SV).
