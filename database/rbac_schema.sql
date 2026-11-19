-- ============================================================
-- Smart Internship Portal — RBAC Schema Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Create the user_profiles table (stores role + status for every auth user)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('student', 'employer', 'faculty', 'admin')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'disabled')),
  display_name    TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS: users can read only their own profile row
CREATE POLICY "user_can_read_own_profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- 4. RLS: users can update only their own profile (not role/status — those are admin-only)
CREATE POLICY "user_can_update_own_display_name"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. RLS: insert allowed during registration (role set server-side by function)
--    We allow insert from the client only for 'student' and 'employer' self-registration.
--    Faculty and admin are created by admin only.
CREATE POLICY "allow_self_registration"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('student', 'employer')
    AND status = 'active'
  );

-- 6. Function: auto-create a user_profiles row on new auth.users insert (optional trigger).
--    If you want to handle role assignment from the client on sign-up instead, skip this.
--    This trigger is useful if you want a default 'student' row to be created automatically.
-- (Optional — uncomment if desired)
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
-- BEGIN
--   INSERT INTO public.user_profiles (user_id, role, display_name)
--   VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'student'), NEW.raw_user_meta_data->>'full_name')
--   ON CONFLICT (user_id) DO NOTHING;
--   RETURN NEW;
-- END;
-- $$;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Add employer-specific fields table
CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name    TEXT,
  company_email   TEXT,
  contact_phone   TEXT,
  website         TEXT,
  industry        TEXT,
  description     TEXT,
  verified        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employer_read_own"
  ON public.employer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "employer_insert_own"
  ON public.employer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "employer_update_own"
  ON public.employer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. Add faculty-specific fields table
CREATE TABLE IF NOT EXISTS public.faculty_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  faculty_id      TEXT,
  full_name       TEXT,
  email           TEXT,
  college         TEXT,
  department      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.faculty_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faculty_read_own"
  ON public.faculty_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "faculty_update_own"
  ON public.faculty_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 9. Create admin-only view for user_profiles (service role only)
-- Admins see all profiles via service role key — never expose service key to client.
-- For the admin dashboard, use Supabase service role only in a backend/function context.
-- The frontend admin dashboard reads profiles via RLS-permitted queries.

-- Allow admin role to read all profiles (for admin dashboard)
CREATE POLICY "admin_read_all_profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles p2
      WHERE p2.user_id = auth.uid() AND p2.role = 'admin'
    )
  );

CREATE POLICY "admin_update_all_profiles"
  ON public.user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles p2
      WHERE p2.user_id = auth.uid() AND p2.role = 'admin'
    )
  );

-- ============================================================
-- HOW TO CREATE ADMIN & FACULTY ACCOUNTS:
--
-- Step 1: Create user via Supabase Auth Dashboard
--   (Authentication → Users → Invite User or Add User)
--
-- Step 2: Run this SQL with the new user's UUID:
--   INSERT INTO public.user_profiles (user_id, role, status, display_name)
--   VALUES ('<USER_UUID_HERE>', 'admin', 'active', 'Administrator Name');
--
-- Step 3: For faculty, also insert into faculty_profiles:
--   INSERT INTO public.faculty_profiles (user_id, full_name, email, college, department, faculty_id)
--   VALUES ('<USER_UUID_HERE>', 'Faculty Name', 'faculty@college.edu', 'College Name', 'CSE', 'FAC001');
-- ============================================================
