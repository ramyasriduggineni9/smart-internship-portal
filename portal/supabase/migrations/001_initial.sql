-- =====================================================================
-- Smart Internship Portal — Initial Migration (Safe & Idempotent)
-- File: 001_initial.sql
-- Run this entire file in the Supabase SQL Editor in one paste.
-- =====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. PROFILES table (linked to auth.users)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','employer','admin')),
  full_name       TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL DEFAULT '',
  college         TEXT DEFAULT '',
  roll_number     TEXT DEFAULT '',
  phone           TEXT DEFAULT '',
  department      TEXT DEFAULT '',
  year            INT DEFAULT 1,
  cgpa            NUMERIC(3,2) DEFAULT 0,
  interests       TEXT[] DEFAULT '{}',
  github          TEXT DEFAULT '',
  linkedin        TEXT DEFAULT '',
  about           TEXT DEFAULT '',
  faculty_title   TEXT CHECK (faculty_title IS NULL OR faculty_title IN ('Mentor','HOD','Placement Officer')),
  employer_status TEXT CHECK (employer_status IS NULL OR employer_status IN ('pending','verified','blocked')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist even if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_number TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year INT DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cgpa NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS about TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faculty_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employer_status TEXT DEFAULT 'pending';

-- =====================================================================
-- 2. TRIGGER: set role from signup metadata
--    Cannot be overridden to admin from client
--    Fires after INSERT on auth.users
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requested TEXT;
BEGIN
  requested := NEW.raw_user_meta_data->>'requested_role';
  IF requested = 'employer' THEN
    INSERT INTO public.profiles(id, role, full_name, email, employer_status)
    VALUES (NEW.id, 'employer', COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email, 'pending')
    ON CONFLICT (id) DO UPDATE SET
      role = 'employer',
      full_name = EXCLUDED.full_name,
      employer_status = 'pending';
  ELSE
    -- Everything else (including 'admin' attempts) becomes student
    INSERT INTO public.profiles(id, role, full_name, email)
    VALUES (NEW.id, 'student', COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check admin role safely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- =====================================================================
-- 3. SKILL GRAPH TABLES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.skills (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Ensure all columns exist on skills if it pre-existed
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS name TEXT;

CREATE TABLE IF NOT EXISTS public.skill_edges (
  id     SERIAL PRIMARY KEY,
  a      TEXT NOT NULL,
  b      TEXT NOT NULL,
  weight NUMERIC(4,3) NOT NULL
);

-- Ensure all columns exist on skill_edges if it pre-existed
ALTER TABLE public.skill_edges ADD COLUMN IF NOT EXISTS a TEXT;
ALTER TABLE public.skill_edges ADD COLUMN IF NOT EXISTS b TEXT;
ALTER TABLE public.skill_edges ADD COLUMN IF NOT EXISTS weight NUMERIC(4,3);

-- =====================================================================
-- 4. STUDENT SKILLS (which skills a student has)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.student_skills (
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  source     TEXT DEFAULT 'manual' CHECK (source IN ('manual','certificate','course')),
  PRIMARY KEY (student_id, skill_name)
);

ALTER TABLE public.student_skills ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.student_skills ADD COLUMN IF NOT EXISTS skill_name TEXT;
ALTER TABLE public.student_skills ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- =====================================================================
-- 5. COURSES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.courses_catalog (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  department  TEXT DEFAULT '',
  description TEXT DEFAULT ''
);

ALTER TABLE public.courses_catalog ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.courses_catalog ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '';
ALTER TABLE public.courses_catalog ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS public.student_courses (
  student_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_name   TEXT NOT NULL,
  completed_at  DATE DEFAULT CURRENT_DATE,
  PRIMARY KEY (student_id, course_name)
);

ALTER TABLE public.student_courses ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE public.student_courses ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE public.student_courses ADD COLUMN IF NOT EXISTS completed_at DATE DEFAULT CURRENT_DATE;

-- =====================================================================
-- 6. EMPLOYERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.employers (
  id       UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company  TEXT NOT NULL DEFAULT '',
  cin      TEXT DEFAULT '',
  gstin    TEXT DEFAULT '',
  website  TEXT DEFAULT '',
  hr_email TEXT DEFAULT '',
  status   TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','blocked')),
  notes    TEXT DEFAULT ''
);

-- Ensure all columns exist on employers if it pre-existed
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS company TEXT DEFAULT '';
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS cin TEXT DEFAULT '';
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS gstin TEXT DEFAULT '';
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS hr_email TEXT DEFAULT '';
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.employers ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- =====================================================================
-- 7. INTERNSHIPS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.internships (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title                TEXT NOT NULL DEFAULT '',
  required_skills      TEXT[] DEFAULT '{}',
  min_cgpa             NUMERIC(3,2) DEFAULT 0,
  prerequisite_courses TEXT[] DEFAULT '{}',
  location             TEXT DEFAULT '',
  stipend              TEXT DEFAULT '',
  status               TEXT DEFAULT 'open' CHECK (status IN ('draft','open','closed')),
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist on internships if it pre-existed
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS employer_id UUID;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}';
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS min_cgpa NUMERIC(3,2) DEFAULT 0;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS prerequisite_courses TEXT[] DEFAULT '{}';
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS stipend TEXT DEFAULT '';
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';

-- =====================================================================
-- 8. APPLICATIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  stage         TEXT DEFAULT 'Applied' CHECK (stage IN ('Applied','Under review','Interview scheduled','Selected','Not selected')),
  history       JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, internship_id)
);

-- Ensure all columns exist on applications if it pre-existed
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'Applied';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]';

-- Backward compatibility sync for existing tables
DO $$
BEGIN
  -- Sync company name if old column company_name exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employers' AND column_name = 'company_name') THEN
    UPDATE public.employers SET company = company_name WHERE (company IS NULL OR company = '') AND company_name IS NOT NULL;
  END IF;

  -- Sync is_verified to status
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'employers' AND column_name = 'is_verified') THEN
    UPDATE public.employers SET status = CASE WHEN is_verified = true THEN 'verified' ELSE 'pending' END WHERE status IS NULL OR status = '';
  END IF;

  -- Sync is_active in internships to status
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'internships' AND column_name = 'is_active') THEN
    UPDATE public.internships SET status = CASE WHEN is_active = true THEN 'open' ELSE 'closed' END WHERE status IS NULL OR status = '';
  END IF;

  -- If stage was integer, convert it to text
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'applications' AND column_name = 'stage' AND data_type = 'integer') THEN
    ALTER TABLE public.applications ALTER COLUMN stage DROP DEFAULT;
    ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_stage_check;
    ALTER TABLE public.applications ALTER COLUMN stage TYPE TEXT USING (
      CASE stage
        WHEN 0 THEN 'Applied'
        WHEN 1 THEN 'Under review'
        WHEN 2 THEN 'Interview scheduled'
        WHEN 3 THEN 'Selected'
        WHEN 4 THEN 'Not selected'
        ELSE 'Applied'
      END
    );
    ALTER TABLE public.applications ALTER COLUMN stage SET DEFAULT 'Applied';
  END IF;
END $$;

-- =====================================================================
-- 9. MESSAGES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body           TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 10. NOC CHAIN
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.noc_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID UNIQUE NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.noc_signatures (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  noc_id      UUID NOT NULL REFERENCES public.noc_requests(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('Mentor','HOD','Placement Officer')),
  signer_name TEXT NOT NULL,
  signed_at   TIMESTAMPTZ DEFAULT now(),
  hash        TEXT NOT NULL,
  UNIQUE(noc_id, role)
);

-- =====================================================================
-- 11. HOURS AND EVALUATION
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.hours_log (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hours          INT NOT NULL CHECK (hours > 0),
  logged_at      DATE DEFAULT CURRENT_DATE,
  notes          TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.evaluations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID UNIQUE NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  employer_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score          INT NOT NULL CHECK (score >= 0 AND score <= 100),
  notes          TEXT DEFAULT '',
  submitted_at   TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 12. GRADEBOOK
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.gradebook (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course     TEXT NOT NULL DEFAULT 'CSE-INT',
  credits    INT DEFAULT 2,
  grade      TEXT,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, course)
);

-- =====================================================================
-- 13. CERTIFICATES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issuer        TEXT NOT NULL,
  credential_id TEXT NOT NULL,
  skill_name    TEXT,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.certificate_registry (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer        TEXT NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  skill_name    TEXT NOT NULL
);

-- =====================================================================
-- 14. LEARNING
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.learning_courses (
  id             SERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  skill_name     TEXT NOT NULL,
  description    TEXT DEFAULT '',
  duration_hours INT DEFAULT 4
);

ALTER TABLE public.learning_courses ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.learning_courses ADD COLUMN IF NOT EXISTS skill_name TEXT;
ALTER TABLE public.learning_courses ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.learning_courses ADD COLUMN IF NOT EXISTS duration_hours INT DEFAULT 4;

-- =====================================================================
-- 15. RESUMES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.resumes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  raw_text         TEXT DEFAULT '',
  ats_score        INT DEFAULT 0,
  last_analysed_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- ROW LEVEL SECURITY POLICIES (Idempotent)
-- =====================================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_courses  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noc_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noc_signatures   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hours_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gradebook        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes          ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.skills                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_edges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses_catalog       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_courses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_registry  ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting legacy policies first
DROP POLICY IF EXISTS "Public internships viewable" ON public.internships;
DROP POLICY IF EXISTS "Public employers viewable" ON public.employers;
DROP POLICY IF EXISTS "Students manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Students manage applications" ON public.applications;

-- Public read for reference tables
DROP POLICY IF EXISTS "public_read_skills" ON public.skills;
CREATE POLICY "public_read_skills" ON public.skills FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_skill_edges" ON public.skill_edges;
CREATE POLICY "public_read_skill_edges" ON public.skill_edges FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_courses_catalog" ON public.courses_catalog;
CREATE POLICY "public_read_courses_catalog" ON public.courses_catalog FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_learning" ON public.learning_courses;
CREATE POLICY "public_read_learning" ON public.learning_courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_cert_registry" ON public.certificate_registry;
CREATE POLICY "public_read_cert_registry" ON public.certificate_registry FOR SELECT USING (true);

-- PROFILES: own row + admin sees all
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_select" ON public.profiles;
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- STUDENT SKILLS
DROP POLICY IF EXISTS "ss_select_own" ON public.student_skills;
CREATE POLICY "ss_select_own" ON public.student_skills FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "ss_insert_own" ON public.student_skills;
CREATE POLICY "ss_insert_own" ON public.student_skills FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "ss_delete_own" ON public.student_skills;
CREATE POLICY "ss_delete_own" ON public.student_skills FOR DELETE USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "ss_admin" ON public.student_skills;
CREATE POLICY "ss_admin" ON public.student_skills FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- STUDENT COURSES
DROP POLICY IF EXISTS "sc_select_own" ON public.student_courses;
CREATE POLICY "sc_select_own" ON public.student_courses FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "sc_insert_own" ON public.student_courses;
CREATE POLICY "sc_insert_own" ON public.student_courses FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "sc_admin" ON public.student_courses;
CREATE POLICY "sc_admin" ON public.student_courses FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- EMPLOYERS: own + admin
DROP POLICY IF EXISTS "emp_select_own" ON public.employers;
CREATE POLICY "emp_select_own" ON public.employers FOR SELECT USING (auth.uid() = id OR status = 'verified' OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "emp_insert_own" ON public.employers;
CREATE POLICY "emp_insert_own" ON public.employers FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "emp_update_own" ON public.employers;
CREATE POLICY "emp_update_own" ON public.employers FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "emp_admin_select" ON public.employers;
CREATE POLICY "emp_admin_select" ON public.employers FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "emp_admin_update" ON public.employers;
CREATE POLICY "emp_admin_update" ON public.employers FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- INTERNSHIPS: students see open only, employers see own, admin sees all
DROP POLICY IF EXISTS "int_student_select" ON public.internships;
CREATE POLICY "int_student_select" ON public.internships FOR SELECT USING (status = 'open' OR employer_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "int_employer_select" ON public.internships;
CREATE POLICY "int_employer_select" ON public.internships FOR SELECT USING (auth.uid() = employer_id);

DROP POLICY IF EXISTS "int_employer_insert" ON public.internships;
CREATE POLICY "int_employer_insert" ON public.internships FOR INSERT WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "int_employer_update" ON public.internships;
CREATE POLICY "int_employer_update" ON public.internships FOR UPDATE USING (auth.uid() = employer_id);

DROP POLICY IF EXISTS "int_admin" ON public.internships;
CREATE POLICY "int_admin" ON public.internships FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "int_admin_update" ON public.internships;
CREATE POLICY "int_admin_update" ON public.internships FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- APPLICATIONS
DROP POLICY IF EXISTS "app_student_select" ON public.applications;
CREATE POLICY "app_student_select" ON public.applications FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "app_student_insert" ON public.applications;
CREATE POLICY "app_student_insert" ON public.applications FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "app_employer_select" ON public.applications;
CREATE POLICY "app_employer_select" ON public.applications FOR SELECT USING (EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND employer_id = auth.uid()));

DROP POLICY IF EXISTS "app_employer_update" ON public.applications;
CREATE POLICY "app_employer_update" ON public.applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND employer_id = auth.uid()));

DROP POLICY IF EXISTS "app_admin" ON public.applications;
CREATE POLICY "app_admin" ON public.applications FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- MESSAGES
DROP POLICY IF EXISTS "msg_select" ON public.messages;
CREATE POLICY "msg_select" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND (a.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.internships WHERE id = a.internship_id AND employer_id = auth.uid()))));

DROP POLICY IF EXISTS "msg_insert" ON public.messages;
CREATE POLICY "msg_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- NOC REQUESTS
DROP POLICY IF EXISTS "noc_req_select" ON public.noc_requests;
CREATE POLICY "noc_req_select" ON public.noc_requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND student_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "noc_req_insert" ON public.noc_requests;
CREATE POLICY "noc_req_insert" ON public.noc_requests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND student_id = auth.uid()));

-- NOC SIGNATURES
DROP POLICY IF EXISTS "noc_sig_select" ON public.noc_signatures;
CREATE POLICY "noc_sig_select" ON public.noc_signatures FOR SELECT USING (EXISTS (SELECT 1 FROM public.noc_requests nr JOIN public.applications a ON a.id = nr.application_id WHERE nr.id = noc_id AND (a.student_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')));

DROP POLICY IF EXISTS "noc_sig_insert" ON public.noc_signatures;
CREATE POLICY "noc_sig_insert" ON public.noc_signatures FOR INSERT WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- HOURS LOG
DROP POLICY IF EXISTS "hours_student_select" ON public.hours_log;
CREATE POLICY "hours_student_select" ON public.hours_log FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "hours_student_insert" ON public.hours_log;
CREATE POLICY "hours_student_insert" ON public.hours_log FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "hours_employer_select" ON public.hours_log;
CREATE POLICY "hours_employer_select" ON public.hours_log FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.internships i ON i.id = a.internship_id WHERE a.id = application_id AND i.employer_id = auth.uid()));

DROP POLICY IF EXISTS "hours_admin" ON public.hours_log;
CREATE POLICY "hours_admin" ON public.hours_log FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- EVALUATIONS
DROP POLICY IF EXISTS "eval_student_select" ON public.evaluations;
CREATE POLICY "eval_student_select" ON public.evaluations FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND student_id = auth.uid()));

DROP POLICY IF EXISTS "eval_employer_insert" ON public.evaluations;
CREATE POLICY "eval_employer_insert" ON public.evaluations FOR INSERT WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "eval_admin" ON public.evaluations;
CREATE POLICY "eval_admin" ON public.evaluations FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- GRADEBOOK
DROP POLICY IF EXISTS "grade_student_select" ON public.gradebook;
CREATE POLICY "grade_student_select" ON public.gradebook FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "grade_admin_all" ON public.gradebook;
CREATE POLICY "grade_admin_all" ON public.gradebook FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- CERTIFICATES
DROP POLICY IF EXISTS "cert_student_select" ON public.certificates;
CREATE POLICY "cert_student_select" ON public.certificates FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "cert_student_insert" ON public.certificates;
CREATE POLICY "cert_student_insert" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = student_id);

-- RESUMES
DROP POLICY IF EXISTS "resume_own" ON public.resumes;
CREATE POLICY "resume_own" ON public.resumes FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- =====================================================================
-- SEED DATA (Safe INSERT ... SELECT ... WHERE NOT EXISTS)
-- =====================================================================

-- Skills (22 nodes)
INSERT INTO public.skills (name)
SELECT s.name
FROM (VALUES
  ('Python'),('Django'),('Flask'),('Pandas'),('Data Analysis'),('Statistics'),
  ('Machine Learning'),('TensorFlow'),('REST APIs'),('Express'),('Node.js'),
  ('JavaScript'),('React'),('HTML/CSS'),('SQL'),('PostgreSQL'),('MongoDB'),
  ('Java'),('Spring Boot'),('Docker'),('AWS'),('Git')
) AS s(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.skills WHERE public.skills.name = s.name
);

-- Skill edges (weighted graph)
INSERT INTO public.skill_edges (a, b, weight)
SELECT e.a, e.b, e.weight
FROM (VALUES
  ('Python','Django',0.800),
  ('Python','Flask',0.800),
  ('Python','Pandas',0.750),
  ('Flask','REST APIs',0.700),
  ('Pandas','Data Analysis',0.800),
  ('Data Analysis','Statistics',0.700),
  ('Machine Learning','TensorFlow',0.750),
  ('Machine Learning','Statistics',0.650),
  ('Machine Learning','Python',0.600),
  ('SQL','PostgreSQL',0.850),
  ('JavaScript','React',0.800),
  ('HTML/CSS','React',0.600),
  ('Node.js','Express',0.850),
  ('Node.js','JavaScript',0.750),
  ('Node.js','REST APIs',0.650),
  ('Java','Spring Boot',0.800),
  ('Docker','AWS',0.600),
  ('Git','Python',0.300),
  ('Git','JavaScript',0.300),
  ('Git','Java',0.300),
  ('Git','SQL',0.300),
  ('Git','Docker',0.300)
) AS e(a, b, weight)
WHERE NOT EXISTS (
  SELECT 1 FROM public.skill_edges WHERE public.skill_edges.a = e.a AND public.skill_edges.b = e.b
);

-- Courses catalog
INSERT INTO public.courses_catalog (name, department, description)
SELECT c.name, c.department, c.description
FROM (VALUES
  ('Data Structures','CSE','Arrays, linked lists, trees, graphs'),
  ('Operating Systems','CSE','Process management, memory, file systems'),
  ('DBMS','CSE','Relational model, SQL, normalization'),
  ('Computer Networks','CSE','TCP/IP, routing, security'),
  ('Web Technologies','CSE','HTML, CSS, JavaScript, REST'),
  ('Python Programming','CSE','Core Python, OOP, libraries'),
  ('Machine Learning','CSE','Supervised, unsupervised, neural networks'),
  ('Software Engineering','CSE','SDLC, agile, testing'),
  ('Cloud Computing','CSE','AWS, Azure, GCP basics'),
  ('Data Analytics','CSE','Statistics, Pandas, visualization')
) AS c(name, department, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.courses_catalog WHERE public.courses_catalog.name = c.name
);

-- Learning courses
INSERT INTO public.learning_courses (title, skill_name, description, duration_hours)
SELECT l.title, l.skill_name, l.description, l.duration_hours
FROM (VALUES
  ('Python for Beginners','Python','Learn Python from scratch with hands-on exercises',6),
  ('Django Web Framework','Django','Build web apps with Django REST Framework',8),
  ('React Fundamentals','React','Component-based UI development with React 18',8),
  ('SQL & PostgreSQL','PostgreSQL','Relational databases and advanced queries',6),
  ('Docker Essentials','Docker','Containerisation and Docker Compose',5),
  ('Machine Learning with Python','Machine Learning','Scikit-learn, model training, evaluation',10),
  ('Node.js & Express','Express','Server-side JavaScript, REST APIs with Express',7),
  ('AWS Cloud Practitioner','AWS','Core AWS services, IAM, S3, EC2',8),
  ('Data Analysis with Pandas','Pandas','Data cleaning, filtering, grouping, aggregation',6)
) AS l(title, skill_name, description, duration_hours)
WHERE NOT EXISTS (
  SELECT 1 FROM public.learning_courses WHERE public.learning_courses.title = l.title
);
