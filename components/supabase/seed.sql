-- 1. CLEANUP: Clear existing logic to prevent conflicts
DROP FUNCTION IF EXISTS public.verify_platform_pin(text, text);
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. SCHEMA: Create users with TEXT ID to support 'admin1' style
CREATE TABLE public.users (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    pin TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
    student_id TEXT UNIQUE,
    teacher_id TEXT UNIQUE,
    parent_id TEXT UNIQUE,
    admin_id TEXT UNIQUE,
    is_online BOOLEAN DEFAULT false,
    profile_pic_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}'::jsonb,
    pan_number TEXT,
    aadhaar_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. SECURITY: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read access profiles" ON public.profiles FOR SELECT USING (true);

-- 5. THE "KEYHOLE": RPC Function for PIN Verification
CREATE OR REPLACE FUNCTION public.verify_platform_pin(p_platform_id TEXT, p_pin TEXT)
RETURNS TABLE (
    user_id TEXT,
    role TEXT,
    email TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.role, u.email
    FROM public.users u
    WHERE u.pin = p_pin
    AND (
        u.student_id = p_platform_id OR
        u.teacher_id = p_platform_id OR
        u.parent_id = p_platform_id OR
        u.admin_id = p_platform_id
    );
END;
$$;

-- 6. DATA: Seed all users
INSERT INTO public.users (id, name, email, phone, pin, password_hash, role, admin_id, is_online)
VALUES ('admin1', 'SWETABH SUMAN', 'admin@pathshaala.com', '1234567890', '123456', crypt('sswetabh', gen_salt('bf')), 'admin', 'ADM-000001', true);

INSERT INTO public.users (id, name, email, phone, pin, password_hash, role, teacher_id)
VALUES ('teacher1', 'DR. PRIYA SHARMA', 'priya.sharma@pathshaala.com', '1234567891', '121212', crypt('teacherpassword', gen_salt('bf')), 'teacher', 'TCH-K2L4P1');

INSERT INTO public.users (id, name, email, phone, pin, password_hash, role, student_id)
VALUES ('student1', 'RAJESH KUMAR', 'rajesh.kumar@pathshaala.com', '1234567892', '232323', crypt('studentpassword', gen_salt('bf')), 'student', 'STU-A1B2C3');

INSERT INTO public.users (id, name, email, phone, pin, password_hash, role, student_id)
VALUES ('parent2', 'VIKRAM VERMA', 'vikram.verma@pathshaala.com', '1234567895', '545454', crypt('parentpassword2', gen_salt('bf')), 'parent', 'PAR-G7H8I9');
-- 7. VERIFY
SELECT count(*) as total_users FROM public.users;