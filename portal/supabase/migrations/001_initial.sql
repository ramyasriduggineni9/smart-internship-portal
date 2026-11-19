-- =====================================================================
-- Smart Internship Portal — Initial Migration
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
    VALUES (NEW.id, 'employer', COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email, 'pending');
  ELSE
    -- Everything else (including 'admin' attempts) becomes student
    INSERT INTO public.profiles(id, role, full_name, email)
    VALUES (NEW.id, 'student', COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 3. SKILLS and SKILL GRAPH
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.skills (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.skill_edges (
  id     SERIAL PRIMARY KEY,
  a      TEXT NOT NULL,
  b      TEXT NOT NULL,
  weight NUMERIC(4,3) NOT NULL,
  UNIQUE(a,b)
);

-- =====================================================================
-- 4. STUDENT SKILLS (which skills a student has)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.student_skills (
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  source     TEXT DEFAULT 'manual' CHECK (source IN ('manual','certificate','course')),
  PRIMARY KEY (student_id, skill_name)
);

-- =====================================================================
-- 5. COURSES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.courses_catalog (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  department  TEXT DEFAULT '',
  description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.student_courses (
  student_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_name   TEXT NOT NULL,
  completed_at  DATE DEFAULT CURRENT_DATE,
  PRIMARY KEY (student_id, course_name)
);

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
  status               TEXT DEFAULT 'draft' CHECK (status IN ('draft','open','closed')),
  created_at           TIMESTAMPTZ DEFAULT now()
);

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
-- ROW LEVEL SECURITY POLICIES
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

-- skills/skill_edges/courses_catalog/learning_courses/certificate_registry: public read
ALTER TABLE public.skills                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_edges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses_catalog       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_courses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_registry  ENABLE ROW LEVEL SECURITY;

-- Public read for reference tables
CREATE POLICY "public_read_skills"            ON public.skills            FOR SELECT USING (true);
CREATE POLICY "public_read_skill_edges"       ON public.skill_edges       FOR SELECT USING (true);
CREATE POLICY "public_read_courses_catalog"   ON public.courses_catalog   FOR SELECT USING (true);
CREATE POLICY "public_read_learning"          ON public.learning_courses  FOR SELECT USING (true);
CREATE POLICY "public_read_cert_registry"     ON public.certificate_registry FOR SELECT USING (true);

-- PROFILES: own row + admin sees all
CREATE POLICY "profiles_select_own"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- STUDENT SKILLS
CREATE POLICY "ss_select_own"  ON public.student_skills FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "ss_insert_own"  ON public.student_skills FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "ss_delete_own"  ON public.student_skills FOR DELETE USING (auth.uid() = student_id);
CREATE POLICY "ss_admin"       ON public.student_skills FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- STUDENT COURSES
CREATE POLICY "sc_select_own" ON public.student_courses FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "sc_insert_own" ON public.student_courses FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "sc_admin"      ON public.student_courses FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- EMPLOYERS: own + admin
CREATE POLICY "emp_select_own"   ON public.employers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "emp_insert_own"   ON public.employers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "emp_update_own"   ON public.employers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "emp_admin_select" ON public.employers FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "emp_admin_update" ON public.employers FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- INTERNSHIPS: students see open only, employers see own, admin sees all
CREATE POLICY "int_student_select"  ON public.internships FOR SELECT USING (status = 'open' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'student');
CREATE POLICY "int_employer_select" ON public.internships FOR SELECT USING (auth.uid() = employer_id);
CREATE POLICY "int_employer_insert" ON public.internships FOR INSERT WITH CHECK (auth.uid() = employer_id AND (SELECT employer_status FROM public.profiles WHERE id = auth.uid()) = 'verified');
CREATE POLICY "int_employer_update" ON public.internships FOR UPDATE USING (auth.uid() = employer_id);
CREATE POLICY "int_admin"           ON public.internships FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "int_admin_update"    ON public.internships FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- APPLICATIONS
CREATE POLICY "app_student_select"  ON public.applications FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "app_student_insert"  ON public.applications FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "app_employer_select" ON public.applications FOR SELECT USING (EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND employer_id = auth.uid()));
CREATE POLICY "app_employer_update" ON public.applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.internships WHERE id = internship_id AND employer_id = auth.uid()));
CREATE POLICY "app_admin"           ON public.applications FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- MESSAGES
CREATE POLICY "msg_select" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND (a.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.internships WHERE id = a.internship_id AND employer_id = auth.uid()))));
CREATE POLICY "msg_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- NOC REQUESTS
CREATE POLICY "noc_req_select" ON public.noc_requests FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND student_id = auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "noc_req_insert" ON public.noc_requests FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND student_id = auth.uid()));

-- NOC SIGNATURES
CREATE POLICY "noc_sig_select" ON public.noc_signatures FOR SELECT USING (EXISTS (SELECT 1 FROM public.noc_requests nr JOIN public.applications a ON a.id = nr.application_id WHERE nr.id = noc_id AND (a.student_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')));
CREATE POLICY "noc_sig_insert" ON public.noc_signatures FOR INSERT WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- HOURS LOG
CREATE POLICY "hours_student_select"  ON public.hours_log FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "hours_student_insert"  ON public.hours_log FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "hours_employer_select" ON public.hours_log FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications a JOIN public.internships i ON i.id = a.internship_id WHERE a.id = application_id AND i.employer_id = auth.uid()));
CREATE POLICY "hours_admin"           ON public.hours_log FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- EVALUATIONS
CREATE POLICY "eval_student_select"  ON public.evaluations FOR SELECT USING (EXISTS (SELECT 1 FROM public.applications WHERE id = application_id AND student_id = auth.uid()));
CREATE POLICY "eval_employer_insert" ON public.evaluations FOR INSERT WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "eval_admin"           ON public.evaluations FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- GRADEBOOK
CREATE POLICY "grade_student_select" ON public.gradebook FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "grade_admin_all"      ON public.gradebook FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- CERTIFICATES
CREATE POLICY "cert_student_select" ON public.certificates FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "cert_student_insert" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "cert_admin"          ON public.certificates FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- RESUMES
CREATE POLICY "resume_own" ON public.resumes FOR ALL USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- =====================================================================
-- SEED DATA
-- =====================================================================

-- Skills (22 nodes)
INSERT INTO public.skills (name) VALUES
('Python'),('Django'),('Flask'),('Pandas'),('Data Analysis'),('Statistics'),
('Machine Learning'),('TensorFlow'),('REST APIs'),('Express'),('Node.js'),
('JavaScript'),('React'),('HTML/CSS'),('SQL'),('PostgreSQL'),('MongoDB'),
('Java'),('Spring Boot'),('Docker'),('AWS'),('Git')
ON CONFLICT (name) DO NOTHING;

-- Skill edges (weighted graph)
INSERT INTO public.skill_edges (a, b, weight) VALUES
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
ON CONFLICT (a, b) DO NOTHING;

-- Courses catalog
INSERT INTO public.courses_catalog (name, department, description) VALUES
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
ON CONFLICT (name) DO NOTHING;

-- Learning courses
INSERT INTO public.learning_courses (title, skill_name, description, duration_hours) VALUES
('Python for Beginners','Python','Learn Python from scratch with hands-on exercises',6),
('Django Web Framework','Django','Build web apps with Django REST Framework',8),
('React Fundamentals','React','Component-based UI development with React 18',8),
('SQL & PostgreSQL','PostgreSQL','Relational databases and advanced queries',6),
('Docker Essentials','Docker','Containerisation and Docker Compose',5),
('Machine Learning with Python','Machine Learning','Scikit-learn, model training, evaluation',10),
('Node.js & Express','Express','Server-side JavaScript, REST APIs with Express',7),
('AWS Cloud Practitioner','AWS','Core AWS services, IAM, S3, EC2',8),
('Git & GitHub','Git','Version control, branching, collaboration',3),
('Data Analysis with Pandas','Pandas','Data wrangling and analysis using Pandas',6)
ON CONFLICT DO NOTHING;

-- Certificate registry (sample issuers for verification)
INSERT INTO public.certificate_registry (issuer, credential_id, skill_name) VALUES
('Coursera','PYTHON-CERT-001','Python'),
('Coursera','REACT-CERT-001','React'),
('AWS','AWS-CLF-001','AWS'),
('Google','GCP-ACE-001','AWS'),
('MongoDB University','MDB-CERT-001','MongoDB')
ON CONFLICT (credential_id) DO NOTHING;

-- =====================================================================
-- HOW TO CREATE THE FIRST ADMIN ACCOUNT:
--
-- 1. Create user in Supabase Auth Dashboard (Authentication > Users > Add User)
--    Email: admin@smartportal.com   Password: (set a strong password)
--
-- 2. Copy the user UUID, then run:
--    UPDATE public.profiles
--    SET role = 'admin', faculty_title = 'Placement Officer'
--    WHERE id = '<PASTE-UUID-HERE>';
--
-- 3. That admin can then create more faculty accounts via the Admin dashboard.
-- =====================================================================
