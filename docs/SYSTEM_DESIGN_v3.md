# 🏛️ Kiến Trúc Hệ Thống App-KCS v3.0 (Lộ trình Super App)

Tài liệu này phác thảo cách chúng ta liên kết các module Sản xuất, Quản trị và Trải nghiệm khách hàng thành một hệ sinh thái duy nhất.

## 1. Tầm nhìn Dữ liệu (The Linked Data Vision)

Chúng ta không xây dựng các tag rời rạc. Mọi dữ liệu đều phải "biết" nhau:

- **KCS (Quality Control):** Biết mẻ gạch này được làm từ máy nào.
- **MMTB (Maintenance):** Biết cái máy này đã sản xuất ra bao nhiêu mẻ gạch lỗi để dự báo hỏng hóc.
- **Phòng ban (Org):** Biết nhân sự nào đang vận hành máy nào và báo cáo KCS nào.
- **AI 3D Visualizer:** Biết khách hàng đang thích mẫu gạch nào để báo về cho bộ phận Sản xuất.

## 2. Cấu trúc các Module (Tag)

### 🧩 TAG 1: Quản lý KCS (Hiện tại)
- **Chức năng:** Bóc tách dữ liệu HMI, lưu trữ kết quả Lab, so sánh tiêu chuẩn.
- **Liên kết:** Mỗi báo cáo gắn với một `machine_id`.

### 🧩 TAG 2: Quản lý MMTB (Máy móc thiết bị)
- **Chức năng:** Quản lý lý lịch máy, lịch bảo trì, thông số vận hành.
- **Logic:** Tích hợp chỉ số **OEE** (Overall Equipment Effectiveness) bằng cách lấy dữ liệu từ các báo cáo KCS.

### 🧩 TAG 3: Quản lý Phòng ban
- **Chức năng:** Thông tin nhân sự, KPI bộ phận, sơ đồ tổ chức.
- **Giao diện:** Trang Dashboard riêng cho từng phòng ban (Sản xuất, Kỹ thuật, Lab).

### 🧩 TAG 4: AI 3D Interior Visualizer
- **Chức năng:** Ốp gạch ảo lên ảnh thực tế của khách hàng.
- **Công nghệ:** Computer Vision (để tìm mặt phẳng) + 3D Rendering (để ốp vật liệu gạch).

## 3. Lộ trình Triển khai (Roadmap)

1.  **Giai đoạn 1 (Foundation):** Chạy SQL Schema mở rộng (file `future-modules-schema.sql`).
2.  **Giai đoạn 2 (MMTB Alpha):** Xây dựng trang danh sách máy móc và nhật ký bảo trì cơ bản.
3.  **Giai đoạn 3 (Department Pages):** Xây dựng trang chi tiết cho các phòng ban.
4.  **Giai đoạn 4 (AI Visualizer):** Nghiên cứu và tích hợp module xử lý hình ảnh 3D.

---
*Tài liệu này được soạn thảo bởi Antigravity dựa trên ý tưởng của Tech Lead Phương Nam.*
