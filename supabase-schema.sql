-- Chạy đoạn mã này trong Supabase SQL Editor

CREATE TABLE kiln_dryer_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Định danh
  batch_code TEXT NOT NULL,           -- Mã mẻ
  product_type TEXT NOT NULL,         -- Loại gạch
  kiln_type TEXT,                     -- Loại lò (xương/men)
  
  -- Lab results
  lab_info JSONB,                     -- Thông tin Lab dạng JSON
  moisture_percent NUMERIC(5,2),      -- Độ ẩm sấy (%)
  strength_value NUMERIC(8,2),        -- Cường độ sấy (N)
  
  -- AI Data
  kiln_data JSONB DEFAULT '{}',       -- Dữ liệu bóc tách từ HMI
  raw_ai_response TEXT,               -- Phản hồi gốc từ Gemini
  
  -- Meta
  image_urls TEXT[] DEFAULT '{}'      -- URL ảnh (nếu dùng Supabase Storage)
);

-- Index để tìm kiếm nhanh
CREATE INDEX idx_reports_created_at ON kiln_dryer_reports(created_at DESC);
CREATE INDEX idx_reports_product ON kiln_dryer_reports(product_type);

-- Kích hoạt RLS (Row Level Security)
ALTER TABLE kiln_dryer_reports ENABLE ROW LEVEL SECURITY;

-- Tạo chính sách cho phép đọc/ghi tự do (Bạn có thể siết chặt sau)
-- Bảng lưu trữ Tiêu chuẩn gốc (Golden Standard)
CREATE TABLE production_standards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  product_type TEXT NOT NULL,       -- ví dụ: '40X80', '60X60'
  category TEXT NOT NULL,           -- 'PREP', 'DRYER', 'KCS'
  standards JSONB NOT NULL,         -- Lưu các mốc Target (D, V, R, nhiệt độ...)
  image_url TEXT,                   -- Ảnh phiếu tiêu chuẩn (nếu có)
  UNIQUE(product_type, category)
);

-- Kích hoạt RLS
ALTER TABLE production_standards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all standards" ON production_standards FOR ALL USING (true);
