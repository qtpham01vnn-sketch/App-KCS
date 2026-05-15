# Nghiệp Vụ Lò Nung & Lọc Dải Nhiệt Cần Đối Soát

Ứng dụng App KCS không lưu toàn bộ 100% dữ liệu HMI thô vào cơ sở dữ liệu để đối soát, bởi vì tùy thuộc vào từng **loại gạch** và **kiểu lò** đang chạy, sẽ có những khoang nhiệt được tắt đi không sử dụng.

Tài liệu này giải thích quy luật lọc dữ liệu động (`KILN_RULES`) được cấu hình tại file `src/lib/constants.js`.

## 1. Cơ Chế Hoạt Động (The Filtering Mechanism)
Sau khi AI hoàn tất việc chuyển ảnh thành dữ liệu JSON (chứa đủ 44 cặp khoang từ M21 đến M63), App sẽ gọi hàm `KILN_RULES.getRange(maGach, loaiLo)` để lấy về 3 chỉ số:
1. `startMod`: Khoang đầu tiên được phép ghi nhận.
2. `endMod`: Khoang cuối cùng được phép ghi nhận.
3. `isEvenAllowed`: Cờ (Boolean) quyết định có lấy các khoang số chẵn hay không. Trong lò Modena, hầu như các số chẵn (M22, M24) không tồn tại hoặc không dùng, chỉ có M62 là ngoại lệ.

Dữ liệu lọc (`filteredModules`) sau đó sẽ được lưu vào Database và hiển thị lên màn hình. Data thô của toàn bộ lò vẫn được giữ lại tại trường `raw_ai_response` trong Supabase phòng trường hợp cần tra soát lại.

## 2. Quy Tắc Chi Tiết Theo Kích Thước Sản Phẩm

### Gạch Ceramic ốp 30X60
Dòng gạch ốp tường kích thước nhỏ:
- **Chạy Lò Xương:** Lò chỉ đốt ở giai đoạn sấy xương, sử dụng khoang từ **M25 đến M47**.
- **Chạy Lò Men:** Nhiệt trải dài hơn để nung men, sử dụng khoang từ **M28 đến M52**. Ở cấu hình này, một số khoang số chẵn được cấp phép hoạt động (`isEvenAllowed = true`).

### Gạch Ceramic ốp 40X80
Dòng gạch ốp tường kích thước lớn, đòi hỏi dải nhiệt nung dài hơn:
- **Chạy Lò Xương:** Sử dụng khoang từ **M25 đến M51**.
- **Chạy Lò Men:** Sử dụng khoang kéo dài tới **M25 đến M55**.

### Gạch Lát (50x50, 60x60, 80x80)
Toàn bộ các dòng gạch lát (dù là Ceramic hay Porcelain xương đá):
- Đều có đặc tính nung khác biệt so với gạch ốp.
- Khi người dùng chọn kích thước này ở Bước 1, App sẽ tự động ép kiểu lò về **"Lò Men"** (Dù người dùng có chọn Lò xương thì hệ thống vẫn ép chuyển).
- Sử dụng vùng nhiệt từ **M25 đến M51** và bật chế độ cho phép đọc các số chẵn (`isEvenAllowed = true`).

## 3. Quy Tắc Ghi Nhận Dữ Liệu Phòng Lab
Với mỗi mẻ nung, App yêu cầu nhập thêm các thông số kiểm tra KCS đầu ra để lưu trữ đồng bộ:
- **Lực bẻ (N)** và **Độ dày (mm)**: Là 2 thông số tối quan trọng, được highlight hiển thị trực tiếp trên Dashboard.
- **Bền uốn** và **Độ hút nước**: Thông số cơ lý hóa phụ trợ.
- **Bài phối liệu** (Xương, Men Engobe, Men Nền): Dùng để truy vết nguyên nhân khi dải nhiệt ổn định nhưng chất lượng gạch vẫn suy giảm.

Việc lưu trữ bộ 3: `[Thông số Lab] + [Dải nhiệt AI HMI] + [Loại sản phẩm]` sẽ giúp nhà máy xây dựng được một bộ "Golden Profile" (Cấu hình vàng) để so sánh và tối ưu hóa các mẻ chạy sau này.
