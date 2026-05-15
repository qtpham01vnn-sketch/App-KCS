# Quy Tắc Trích Xuất: Lò Sấy 5 Tầng

## 1. Cấu trúc lưới nhiệt độ (Dryer Grid)
Lò sấy là hệ thống phức tạp nhất với 5 tầng sấy. Hệ thống trích xuất dữ liệu thành một lưới 120 điểm nhiệt:
- **Số tầng**: 1, 2, 3, 4, 5.
- **Số khoang (Zones)**: Từ K1 đến K12.
- **Dữ liệu mỗi ô**: Mỗi vị trí (Tầng x Khoang) sẽ có 2 giá trị nhiệt độ PV/SV được AI nhận diện.

## 2. Thông số đặc thù Lò Sấy
Ngoài nhiệt độ, báo cáo lò sấy bắt buộc phải có:
- **Quạt dẫn động**: Tần số hoạt động (Hz).
- **Cường độ Lab**: Thông số cường độ mẻ sấy (VD: 30.2-7.4-1.1).
- **Độ ẩm (%)**: Chỉ số độ ẩm sau sấy.

## 3. Hiển thị Heatmap (Bản đồ nhiệt)
Trong cơ sở dữ liệu, lưới nhiệt độ được hiển thị dưới dạng bản đồ màu sắc:
- Màu lạnh (Xanh): Nhiệt độ thấp.
- Màu nóng (Vàng/Cam/Đỏ): Nhiệt độ cao.
Giúp người quản lý nhận diện ngay lập tức sự bất thường về nhiệt giữa các tầng.

## 4. Nguyên lý lưu trữ
Dữ liệu lưới 120 điểm được đóng gói vào một mảng JSON (Array) để đảm bảo không bị thất lạc khi truyền tải lên Cloud.
