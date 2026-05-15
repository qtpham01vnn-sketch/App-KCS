# Luồng Tương Tác & Tính Năng Giao Diện (User Flows)

App KCS được thiết kế với triết lý UI/UX "Dark Glassmorphism" mang đậm tính Industrial, hiện đại và tập trung giảm thiểu sai sót cho kỹ sư (Human Error).

## 1. Luồng Đối Soát KCS (Quy Trình 4 Bước)
Đây là tính năng cốt lõi của ứng dụng, hoạt động dựa trên biểu đồ tiến trình (Wizard) tại tab **Đối soát KCS**.

- **Bước 1: Thông tin Lab**
  - Người dùng chọn Ca trực, nhập Tên ca trưởng.
  - Chọn Mã gạch. *Tính năng thông minh:* Tự động chuyển đổi `Loại Lò` thành "Lò Men" nếu người dùng chọn các loại gạch lát kích thước 50x50, 60x60, 80x80.
  - Nhập các chỉ số chất lượng xuất xưởng (Lực bẻ, Độ dày...). Nhấn Tiếp theo.
- **Bước 2: Nạp ảnh HMI**
  - Tải lên 1 hoặc nhiều hình ảnh chụp màn hình HMI Modena. Giao diện cho phép xem trước thu nhỏ (thumbnail) và xóa ảnh nếu tải nhầm.
- **Bước 3: AI Phân tích**
  - Người dùng nhấn nút "Phân tích AI Vision". Nút này sẽ disable (mờ đi) và hiện loading để tránh việc người dùng nhấn gửi dữ liệu 2 lần. 
  - Nếu gặp lỗi kết nối API hoặc Google AI quá tải (Lỗi 503), ứng dụng sẽ bắn ra một cảnh báo việt hóa màu đỏ hướng dẫn người dùng thử lại sau 30 giây.
- **Bước 4: Kết quả ISO & Lưu trữ**
  - Hiển thị bảng đối soát nhiệt độ cực kỳ trực quan với 3 cột: `Zone`, `Trục Trên (PV/SV)`, `Trục Dưới (PV/SV)`. 
  - Hiển thị bảng Áp suất và Tần số Quạt bên dưới.
  - Sau khi kiểm tra AI đã trích xuất chuẩn xác, người dùng bấm "Chỉ Lưu Database" hoặc "Làm lại (Lưu & Tiếp)" để commit dữ liệu vào Supabase. Một thông báo thành công sẽ xuất hiện.

## 2. Luồng So Sánh Dải Nhiệt (🔒 LOCKED — `Comparison.jsx`)
Chức năng này dùng khi phát hiện chất lượng gạch của một mẻ bị lỗi (ví dụ lực bẻ yếu đi), KCS cần đối chiếu xem dải nhiệt của mẻ lỗi khác biệt thế nào so với mẻ chuẩn. Cũng dùng khi nhà máy chuyển đổi sản phẩm và cần so sánh cấu hình nhiệt giữa các dòng gạch khác nhau.

### Hàng trên: Bộ lọc Đa tầng (Master Filters)
- **Bộ lọc Ngày**: Lọc danh sách mẻ theo ngày cụ thể.
- **Bộ lọc Sản phẩm**: Dropdown chọn loại gạch (Tất cả, Ceramic ốp 30x60, 40x80...).
- **Bộ lọc Loại lò**: Dropdown chọn Lò Xương / Lò Men / Lò Sấy.
- **Chọn Mẻ A (Chuẩn)** và **Mẻ B (So sánh)**: Sau khi lọc, chọn 2 mẻ cần đối chiếu.

### Hàng dưới: So sánh Song song (Side-by-Side)
Mỗi mẻ hiển thị đầy đủ 100% thông số như AI trích xuất:
- **Khối Lab & Phối liệu**: Lực bẻ, Bền uốn, Độ dày, Bài xương/Men Engobe/Men Nền.
- **Khối Nhiệt độ**: Bảng PV/SV cho từng Zone (Trục trên Mxx & Trục dưới M0xx).
- **Khối Phụ trợ**: Quạt (Hz) và Áp suất (Pa) — TP1-TP5, MC1.

### Cột Delta (Tự động)
- Hệ thống tính toán `Mẻ A PV - Mẻ B PV` cho mỗi Zone.
- **Cảnh báo Đỏ (có hiệu ứng pulse)**: Khi Delta vượt ngưỡng **5°C**.
- **Xanh Emerald**: Khi Delta nằm trong ngưỡng an toàn.

### Xuất PDF So sánh
- Nút **"Xuất PDF"** nằm ở thanh toolbar (mờ đi khi chưa chọn mẻ).
- Mở tab mới với báo cáo HTML chuyên nghiệp: 2 cột Mẻ A / Mẻ B + Bảng Delta.
- Nút **"BẤM ĐỂ IN HOẶC LƯU PDF"** ở góc dưới phải (ẩn khi in).

## 3. Dashboard Tổng Quan & Thư Viện
- **Bảng Điều Khiển (Dashboard):** 
  - Hiển thị số lượng mẻ nung đã đồng bộ lưu trữ.
  - Thước đo Tỉ lệ đạt ISO ảo. Trạng thái hoạt động của Engine AI (Sẵn sàng/Lỗi).
- **Cơ Sở Dữ Liệu:**
  - Danh sách Grid Liệt kê toàn bộ các báo cáo KCS từ Cloud (Mới nhất nằm trên cùng).
  - Có nút "Mắt" (Eye icon) để bật Popup Modal xem lại toàn bộ chi tiết một mẻ nung đã lưu trữ trong quá khứ, bao gồm cả bảng nhiệt độ PV/SV hoàn chỉnh như ở màn hình đối soát. Modal được bo viền sáng hiện đại, cho phép xem mà không phải load lại trang.

## 4. Luồng Đăng nhập & Phân quyền (`LoginGate.jsx`)

### 4.1. Đăng nhập (Admin hoặc Viewer)
1. Mở app → Hiện màn hình đăng nhập (Dark Glassmorphism + Logo Phương Nam).
2. Nhập **Tên đăng nhập** + **Mật khẩu** → Bấm **"Đăng nhập"**.
3. Tài khoản Admin mặc định: `admin` / `phuongnam2026`.
4. Sau khi đăng nhập → Header hiển thị tên + vai trò (Quản trị viên / Người xem).

### 4.2. Yêu cầu truy cập (Người dùng mới)
1. Tại màn hình đăng nhập → Bấm **"Yêu cầu quyền truy cập"**.
2. Nhập **Họ tên** + chọn **Phòng ban** (6 lựa chọn: Phòng KCS, Lab, Công nghệ, Ban TGĐ, PXSX, PXCĐ-NL).
3. Bấm **"Gửi yêu cầu"** → Thông báo xác nhận.
4. Chờ Admin duyệt và cấp tài khoản.

### 4.3. Admin duyệt yêu cầu
1. Vào **Cài đặt hệ thống** → Tab **"Thông báo"** (badge đỏ hiện số yêu cầu).
2. Với mỗi yêu cầu: Nhập **Username** + **Mật khẩu** cấp cho user.
3. Bấm **"Duyệt & Cấp TK"** hoặc **"Từ chối"**.

## 5. Luồng Cài đặt hệ thống (`Settings.jsx`)
| Tab | Chức năng | Quyền |
|-----|-----------|-------|
| Hồ sơ cá nhân | Đổi tên hiển thị, phòng ban → cập nhật Header ngay | Admin + Viewer |
| Quản trị nhân sự | Xem danh sách user, xóa user | Admin only |
| Bảo mật & Quyền | Đổi mật khẩu admin | Admin only |
| Thông báo | Duyệt/Từ chối yêu cầu truy cập | Admin only |
| Dữ liệu hệ thống | Thống kê mẻ, trạng thái Supabase/Gemini | Admin + Viewer |
| Đăng xuất | Thoát về màn hình đăng nhập | Admin + Viewer |
| Reset toàn bộ | Xóa dữ liệu Cloud (modal gõ "XÓA TẤT CẢ") | Admin only |

## 6. Luồng AI Chatbot (Dashboard → AI Command Center)

### 6.1. Hỏi đáp với AI
1. Tại **Bảng điều khiển** → Khu vực **AI Command Center** (giữa màn hình).
2. Gõ câu hỏi vào ô input → Bấm **"Gửi lệnh"** hoặc nhấn Enter.
3. AI suy nghĩ (hiện loading "Phương Nam AI đang suy nghĩ...") → Trả lời.

### 6.2. Các loại câu hỏi AI hỗ trợ
| Loại câu hỏi | Ví dụ |
|---------------|-------|
| Dữ liệu mẻ nung | "Lực bẻ mẻ gần nhất?" / "Nhiệt độ zone M25 mẻ Ceramic 40x80?" |
| Tiêu chuẩn ISO | "ISO 13006 là gì?" / "Lực bẻ chuẩn ISO bao nhiêu?" |
| Lỗi & Khắc phục | "Gạch bị cong vênh nguyên nhân gì?" / "Pinhole khắc phục ra sao?" |
| Quy trình sản xuất | "Nhiệt độ nung Porcelain?" / "Quy trình ép gạch?" |
| Tri thức tùy chỉnh | Trả lời dựa trên tài liệu anh upload ở Kho Tri Thức |

### 6.3. Kiến trúc 3 lớp dữ liệu
```
Mega System Prompt (ISO, lỗi, quy trình — hardcode ~2000 từ)
    +
Kho Tri Thức (tài liệu anh upload — localStorage)
    +
Dữ liệu mẻ nung (lọc thông minh từ Supabase Cloud)
    ↓
Gemini 2.5 Flash → Câu trả lời chuyên gia
```

## 7. Luồng Kho Tri Thức (`KnowledgeBase.jsx`)

### 7.1. Upload tài liệu (Admin only)
1. Vào **Kho Tri Thức** trên sidebar → Bấm **"Thêm tài liệu"**.
2. Chọn file (.txt / .md / .pdf) hoặc dán nội dung text thủ công.
3. Đặt **Tên** + chọn **Danh mục** (6 loại).
4. Bấm **"Lưu vào Kho Tri Thức"** → Hiện trong danh sách.

### 7.2. Quản lý tài liệu
- Bấm tài liệu → Xem nội dung đầy đủ (panel phải).
- Lọc theo danh mục hoặc tìm kiếm theo tên.
- Bấm **🗑️** để xóa (Admin only).

### 7.3. Kết nối với AI Chatbot
- Khi user hỏi chatbot → Hệ thống tự tìm tài liệu liên quan theo từ khóa.
- Gửi tối đa 3 tài liệu liên quan nhất (mỗi tài liệu tối đa 3000 ký tự) cho AI.
- AI ưu tiên trích dẫn tài liệu Kho Tri Thức khi trả lời.
