-- ==========================================================
-- SQL SCHEMA ĐÃ SỬA (TRÁNH XUNG ĐỘT VỚI BẢNG CŨ)
-- Chạy đoạn này trong Supabase SQL Editor
-- ==========================================================

-- 1. Bảng Phòng ban (KCS Departments)
CREATE TABLE IF NOT EXISTS public.kcs_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    manager_name TEXT,
    contact_info TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bảng Máy móc thiết bị (KCS Machines)
CREATE TABLE IF NOT EXISTS public.kcs_machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.kcs_departments(id), -- Liên kết đúng kiểu UUID
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    type TEXT,
    specs JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    installation_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Bảng Nhật ký bảo trì (KCS Maintenance Logs)
CREATE TABLE IF NOT EXISTS public.kcs_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES public.kcs_machines(id) ON DELETE CASCADE,
    issue_description TEXT,
    action_taken TEXT,
    technician_name TEXT,
    cost NUMERIC(15,2) DEFAULT 0,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Liên kết KCS hiện tại với Máy móc
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='kiln_dryer_reports' AND column_name='machine_id') THEN
        ALTER TABLE public.kiln_dryer_reports ADD COLUMN machine_id UUID REFERENCES public.kcs_machines(id);
    END IF;
END $$;

-- Kích hoạt RLS
ALTER TABLE public.kcs_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kcs_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kcs_maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Chính sách cho phép (Anh có thể siết lại sau)
CREATE POLICY "Allow all on kcs_departments" ON public.kcs_departments FOR ALL USING (true);
CREATE POLICY "Allow all on kcs_machines" ON public.kcs_machines FOR ALL USING (true);
CREATE POLICY "Allow all on kcs_maintenance_logs" ON public.kcs_maintenance_logs FOR ALL USING (true);
