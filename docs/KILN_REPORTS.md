# Quy Tắc Trích Xuất: Lò Nung Men/Xương

## 1. Cấu trúc dữ liệu nhiệt độ
Hệ thống trích xuất nhiệt độ theo từng Module (Mxx). Mỗi Module bao gồm:
- **Nhiệt Trên**: Cặp giá trị PV (Thực tế) và SV (Cài đặt).
- **Nhiệt Dưới**: Cặp giá trị PV/SV (Thường được ký hiệu là M0xx trong dữ liệu gốc).

## 2. Quy tắc loại bỏ dữ liệu (Exclusion Rules)
Để báo cáo tập trung vào các thông số quan trọng nhất, hệ thống **bắt buộc loại bỏ** các khoang/quạt sau đây (không hiển thị trong kết quả trích xuất và báo cáo):
- **M7, M11, M14, M17, M19, M20**.
- Các khoang này được xác định là không cần thiết cho báo cáo KCS tiêu chuẩn của anh.

## 3. Hệ thống Quạt và Áp suất
- **Quạt**: Trích xuất tên quạt và tần số (Hz).
- **Áp suất**: Trích xuất các chỉ số áp suất tại các điểm TP1, TP2, TP3, TP4, TP5 và MC1.

## 4. Thông số LAB/Kỹ thuật
- Sản phẩm (Loại gạch).
- Lực bẻ (N).
- Bền uốn (N/mm2).
- Độ dày min (mm).
- Độ hút nước (%).
- Bài xương, Men Engobe, Men nền.

## 5. Nguyên lý xử lý AI
Sử dụng thuật toán "Column-by-column" để phân tích ảnh chụp màn hình HMI. AI sẽ quét theo cột dọc để tránh nhầm lẫn giữa các hàng PV và SV khi dữ liệu bị nhảy mảng.
