# 🌟 Chi Tiết Tính Năng & Nguyên Lý Hoạt Động

Tài liệu này định nghĩa chi tiết tất cả 5 phân hệ chính tương ứng với 5 tab trên thanh tác vụ của ứng dụng **Memories AI Creative Studio Pro**.

---

## 1. 🎞️ Tab FEED (Kỷ ức gần đây)
*   **Giao diện**: Nằm tại trang chủ (`/`). Trình diễn các bức ảnh và thước phim kỷ niệm gần đây của người dùng dưới dạng lưới Grid bất đối xứng cao cấp (Pinterest-style).
*   **Nguyên lý hoạt động**:
    *   Tự động quét danh sách Album đã tạo từ cơ sở dữ liệu `memories_created_albums`.
    *   Trình chiếu các bức ảnh nổi bật kèm hiệu ứng lướt nhẹ (fade-in on scroll) và bộ màu cổ điển ấm áp.
    *   Cung cấp phím tắt nhanh để người xem có thể mở ngay cuốn sách lật 3D tương ứng hoặc chỉnh sửa tiếp.

---

## 2. 📸 Tab TẠO (Khởi tạo Album thông minh)
*   **Giao diện**: Màn hình chọn ảnh (`/create`).
*   **Các tính năng cốt lõi**:
    1.  **Tải ảnh từ máy tính**: Người dùng có thể chọn nhiều ảnh cùng lúc từ máy tính cá nhân. Khi tải ảnh thành công, màn hình sẽ nổ pháo hoa rực rỡ để chúc mừng.
    2.  **Liên kết kho ảnh đẹp miễn phí**: Tích hợp các bộ sưu tập ảnh chất lượng cao theo chủ đề đa dạng:
        *   *Khối Thiên nhiên*: Cây cối, phong cảnh, sông suối, biển cả, rừng núi... giúp lồng bối cảnh cực đẹp.
        *   *Khối Sản xuất*: Xưởng sản xuất, văn phòng làm việc, quy trình lắp ráp công nghiệp...
        *   *Khối Điện ảnh*: Các góc máy đậm chất xi-nê, ánh sáng lộng lẫy nghệ thuật.
        *   *Khối AI*: Robot, bảng mạch công nghệ, không gian mạng 3D tương lai.
    3.  **Tùy biến chữ & Màu sắc phụ đề**:
        *   Hệ thống cho phép chọn cỡ chữ (`Nhỏ`, `Vừa`, `Lớn`) phù hợp với mọi độ dài ghi chú.
        *   Bảng màu (Color Picker) đa dạng. Khi người dùng tự chọn màu chữ, hệ thống tự động loại bỏ các màu mặc định để hiển thị chính xác 100% màu phối đã chọn.

---

## 💬 3. Tab AI CHAT (Trình chỉnh sửa thông minh bằng AI)
*   **Giao diện**: Trình chat đối thoại (`/editor`).
*   **Nguyên lý hoạt động**:
    *   Người dùng có thể trò chuyện với trợ lý AI bằng ngôn ngữ tự nhiên để điều khiển cuốn sách kỷ niệm.
    *   AI có khả năng nhận diện các ý định:
        *   *Yêu cầu ghép ảnh/bối cảnh*: "hãy ghép ảnh tôi vào bối cảnh hoàng hôn biển".
        *   *Yêu cầu đổi nhạc*: "hãy đổi sang bài Morning Forest Harp".
        *   *Yêu cầu chỉnh phụ đề*: "đổi ghi chú trang 1 thành 'Ngày hè yêu thương'".
    *   **Tải nhạc nền tùy chỉnh**: Cho phép người dùng lồng bản nhạc MP3 riêng từ máy tính của mình hoặc chọn nhanh từ danh sách nhạc nền cao cấp có sẵn (Bella Ciao, Chopin, Mozart, Sunset Acoustic Guitar...).
    *   **AI Exporting Engine**: Khi bấm **Xuất Video / Sách**, cửa sổ 3D Glassmorphic sẽ hiển thị tiến trình Render giả lập từng bước (Tổng hợp ảnh, áp dụng lật 3D, thiết kế phụ đề, lồng nhạc nền) trước khi tự động tải xuống file.

---

## 📖 4. Tab THƯ VIỆN (Sách lật tương tác 3D)
*   **Giao diện**: Màn hình xem Album (`/album/:id`).
*   **Các tính năng cốt lõi**:
    1.  **Lật trang 3D tương tác**: Áp dụng hiệu ứng đổ bóng và xoay trục 3D mô phỏng 100% động tác lật trang sách giấy vật lý của Heygen. Hỗ trợ cả chế độ lật tự động và lật thủ công.
    2.  **Đồng bộ âm thanh nền**: Tự động phát đúng bản nhạc đã lưu của Album đó với âm lượng được ghi nhớ.
    3.  **Polaroid Border Cách tân**: Loại bỏ hoàn toàn chữ thô. Góc dưới ảnh Polaroid hiển thị tiêu đề Album và mã trang viết tay: `✨ August in Amalfi - #1`, tạo cảm giác giống như một cuốn sổ dán ảnh handmade thực tế.
    4.  **Xuất bản Offline Đơn lập**: Đóng gói toàn bộ mã nguồn HTML, CSS, JS, ảnh HD và phụ đề thành một file `.html` duy nhất. Người dùng có thể chia sẻ file này để mở ngoại tuyến trên bất kỳ trình duyệt nào.

---

## 🎨 5. Tab BẢN SẮC (Đồng bộ hóa Google Stitch)
*   **Giao diện**: Bảng tùy chỉnh Ambiance (`AmbianceSelector`).
*   **Mục tiêu**: Thiết lập và duy trì tính nhất quán về mặt thị giác của ứng dụng dựa trên hệ thống Design Tokens.
*   **Nguyên lý hoạt động**:
    *   **Đồng bộ hóa Stitch**: Cho phép kết nối và cập nhật trực tiếp phông chữ, bảng màu nguyên bản, độ bo góc của các nút bấm từ Stitch.
    *   **Chuyển đổi giao diện nhanh**: Cung cấp các chủ đề được thiết kế sẵn (Luminous Keepsake, Dark Glassmorphism, Brutalist Industry, Minimalist Editorial) giúp thay đổi toàn bộ diện mạo ứng dụng chỉ với một cú chạm.
