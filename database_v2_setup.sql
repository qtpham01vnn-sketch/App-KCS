-- ==========================================
-- PHUONG NAM SMART KCS v2.0 - DATABASE SETUP
-- ==========================================

-- 1. PROFILES TABLE (Quản lý người dùng & Phê duyệt)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'blocked')),
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PRODUCTION LOGS (Lưu trữ dữ liệu KCS)
CREATE TABLE IF NOT EXISTS public.production_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES public.profiles(id),
  
  -- Thông tin định danh
  batch_code TEXT NOT NULL,
  kiln_id TEXT NOT NULL, -- Ví dụ: Lò 01, Lò 02
  product_name TEXT NOT NULL,
  
  -- Dữ liệu KCS (Bóc tách từ HMI)
  hmi_data JSONB NOT NULL DEFAULT '{}',
  lab_data JSONB DEFAULT '{}',
  
  -- AI Metadata
  ai_raw_output TEXT,
  image_url TEXT,
  
  -- Audit
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id)
);

-- 3. KNOWLEDGE BASE (Lưu trữ Vectors cho RAG)
-- Yêu cầu: Đã cài đặt extension `pgvector` trên Supabase
-- CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS public.kb_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536), -- 1536 cho text-embedding-004 của Google
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4.2 Production Logs Policies
CREATE POLICY "Only approved users can view logs." ON public.production_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.status = 'approved'
    )
  );

CREATE POLICY "Only approved users can insert logs." ON public.production_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.status = 'approved'
    )
  );

-- 5. TRIGGER: Tự động tạo profile khi user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'employee',
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
