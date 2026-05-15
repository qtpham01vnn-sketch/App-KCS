# 🧠 Logic trích xuất AI Vision (HMI Modena)

Đây là "linh hồn" của ứng dụng, chứa các quy tắc nghiệp vụ đặc thù cho lò nung Modena.

## 2. Quy tắc trích xuất PV/SV (QUY TẮC TRỤC DỌC TUYỆT ĐỐI)
- **Trục dọc**: [Nhãn ID] -> [Số Đỏ PV] -> [Số Xanh SV] phải nằm trên một đường thẳng đứng. Tuyệt đối không lấy số bị lệch sang cột bên cạnh.
- **Hộp kín**: Số Đỏ và số Xanh phải là một cặp đi liền nhau trong cùng một mặt đồng hồ. Cấm tráo đổi số Đỏ của hàng này với số Xanh của hàng kia.
- **Quy tắc "N/A" (Chế độ Gió/Gas)**:
  - **Phạm vi**: Từ khoang **M21 đến M27**.
  - **Điều kiện**: Nếu số Xanh (SV) là mã `P...` hoặc số nhỏ (<100) trong khi số Đỏ (PV) cao (>500), ghi SV là **"N/A"**.

## 3. Phân nhóm Sản phẩm & Lò
Hệ thống tự động lọc dải module dựa trên cấu hình:
- **Gạch Ốp (40x80)**: Thường quét từ M25 - M63 (Chỉ lấy module LẺ).
- **Gạch Lát (60x60, 80x80)**: Quét dải rộng hơn và có thể bao gồm cả module chẵn.

## 4. Hệ thống Quạt & Áp suất
- **Quạt (Hz)**: Chỉ lấy trị số Hz trên cùng, bỏ qua các chỉ số dòng điện (A) hoặc điện áp (V).
- **Áp suất (Pa)**: Trích xuất các chỉ số TP1, TP2... thường có giá trị âm hoặc dương nhỏ.
+
+## 5. Logic Kho Tri Thức (Knowledge Base 2.0)
+- **AI OCR Vision**: Sử dụng model `gemini-1.5-flash` để quét ảnh scan PDF, tái cấu trúc bảng Markdown.
+- **Clean Text Logic**: Tự động loại bỏ các ký tự Markdown (`|`, `---`, `_`) sau khi trích xuất để tối ưu hóa context cho Chatbot.
+- **Office Processing**: Sử dụng `mammoth` (Word) và `xlsx` (Excel) để xử lý dữ liệu cấu trúc cao trước khi đưa vào AI.
