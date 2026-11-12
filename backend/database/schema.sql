-- =====================================================
-- SMART INTERNSHIP PORTAL - DATABASE SCHEMA
-- Matrusri Engineering College - CSE Team D07
-- Database: PostgreSQL / Supabase
-- =====================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Students Profile Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    college TEXT NOT NULL DEFAULT 'Matrusri Engineering College',
    department TEXT NOT NULL DEFAULT 'CSE',
    graduation_year INT NOT NULL DEFAULT 2027,
    cgpa NUMERIC(3, 2) DEFAULT 8.20,
    skills TEXT[] DEFAULT ARRAY['Python', 'SQL', 'HTML/CSS', 'Git', 'Flask'],
    completed_courses TEXT[] DEFAULT ARRAY['DBMS', 'Operating Systems', 'Data Structures', 'Web Technologies', 'Python Programming'],
    resume_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Employers Table
CREATE TABLE IF NOT EXISTS public.employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL UNIQUE,
    cin TEXT,
    gstin TEXT,
    website TEXT,
    hr_email TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Internship Postings Table
CREATE TABLE IF NOT EXISTS public.internships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID REFERENCES public.employers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    description TEXT,
    required_skills TEXT[] NOT NULL,
    min_cgpa NUMERIC(3, 2) DEFAULT 6.50,
    prerequisite_courses TEXT[] DEFAULT ARRAY[]::TEXT[],
    location TEXT NOT NULL DEFAULT 'Hyderabad · Hybrid',
    stipend TEXT NOT NULL DEFAULT '₹20,000/mo',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Applications Table (Kanban Lifecycle)
-- Stages: 0 = Applied, 1 = Under Review, 2 = Interview Scheduled, 3 = Selected, 4 = Rejected
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    internship_id UUID REFERENCES public.internships(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    stage INT DEFAULT 0 CHECK (stage BETWEEN 0 AND 4),
    status_log JSONB DEFAULT '[]'::jsonb,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(internship_id, student_id)
);

-- 6. Digital NOC Workflow & E-Signatures Table
-- Chain: Mentor -> HOD -> Placement Officer
CREATE TABLE IF NOT EXISTS public.noc_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    mentor_signature JSONB,
    hod_signature JSONB,
    placement_signature JSONB,
    is_fully_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Academic Credit Transfer & Evaluation Table
CREATE TABLE IF NOT EXISTS public.academic_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
    course_code TEXT DEFAULT 'CSE-INT',
    course_name TEXT DEFAULT 'Internship (CSE-INT)',
    hours_logged INT DEFAULT 0 CHECK (hours_logged >= 0),
    evaluation_score INT CHECK (evaluation_score BETWEEN 0 AND 100),
    grade TEXT,
    is_pushed_to_gradebook BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Row Level Security (RLS) Policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noc_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_credits ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active internships & verified employers
CREATE POLICY "Public internships viewable" ON public.internships FOR SELECT USING (is_active = true);
CREATE POLICY "Public employers viewable" ON public.employers FOR SELECT USING (true);

-- Allow students to read & update their own profiles
CREATE POLICY "Students manage own profile" ON public.students 
FOR ALL USING (auth.uid() = user_id);

-- Allow students to view and manage their applications
CREATE POLICY "Students manage applications" ON public.applications 
FOR ALL USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

