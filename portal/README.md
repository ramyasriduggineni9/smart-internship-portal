# Smart Internship Portal

Smart Internship Portal is an AI-powered full-stack web application designed for students, enterprise employers, and college administrators/faculty (Mentors, HODs, Placement Officers). It connects students with verified internships through a 22-node weighted skill graph, automated eligibility verification, sequential paperless NOC e-approvals, work hours logging, and automatic academic credit transfer.

---

## 1. Tech Stack & Architecture

- **Frontend:** React 18, Vite, TypeScript, React Router v6.
- **Styling:** Pure CSS custom properties (design tokens) supporting Light and auto-Dark modes (`prefers-color-scheme`). No Tailwind.
- **Typography:**
  - Headings: `Bricolage Grotesque` (600, 700)
  - Body: `IBM Plex Sans` (400, 500, 600)
  - IDs & Numerics: `IBM Plex Mono`
  - Digital Signatures: `Caveat` (600)
- **Backend & Auth:** Supabase (PostgreSQL, Row Level Security, Realtime, Database Triggers).
- **Deployment:** Netlify with `/*  /index.html  200` rewrite rule in `public/_redirects`.

---

## 2. Prerequisites & Environment Setup

1. Copy `.env.example` to `.env` inside the `portal` folder:
   ```bash
   cp .env.example .env
   ```
2. Populate your Supabase project credentials in `.env`:
   ```ini
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

---

## 3. Database Migration & RLS Setup

1. Open your [Supabase Dashboard](https://app.supabase.com).
2. Go to the **SQL Editor** tab.
3. Open `portal/supabase/migrations/001_initial.sql`.
4. Copy the entire file content, paste it into the SQL editor, and click **Run**.
5. This migration configures:
   - All 15 database tables (`profiles`, `skills`, `skill_edges`, `student_skills`, `courses_catalog`, `student_courses`, `employers`, `internships`, `applications`, `messages`, `noc_requests`, `noc_signatures`, `hours_log`, `evaluations`, `gradebook`, `learning_courses`, `resumes`).
   - Secure trigger `handle_new_user()` which reads `requested_role` from user metadata and prevents client payloads from assigning `admin`.
   - Comprehensive Row Level Security (RLS) policies on every table.
   - Seed data for 22 skill graph nodes, weighted edges, courses, and learning modules.

---

## 4. Creating Admin & Faculty Accounts

For security, public self-registration for `admin` accounts is strictly blocked in both client code and database triggers. To create an Admin or Faculty member:

1. **Self-register or invite user:** The faculty member creates an account (e.g. through the welcome page) with their institutional email address.
2. **Promote via Supabase SQL Editor:** Run the following SQL query in the Supabase SQL editor:
   ```sql
   UPDATE public.profiles
   SET role = 'admin', faculty_title = 'Mentor' -- Options: 'Mentor', 'HOD', 'Placement Officer'
   WHERE email = 'faculty@college.edu';
   ```
3. Alternatively, any existing logged-in administrator can designate titles under **Manage Faculty** (`/admin/create-faculty`) in the portal.

---

## 5. Local Development & Build

Install dependencies and start the Vite local dev server:

```bash
cd portal
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

The output bundle will be generated in `dist/`.

---

## 6. Netlify Deployment

1. Connect your repository to Netlify.
2. Configure build settings:
   - **Base directory:** `portal`
   - **Build command:** `npm run build`
   - **Publish directory:** `portal/dist`
3. In Netlify Site Settings > **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. The included `public/_redirects` ensures that direct routing and browser refresh on paths like `/student/dashboard` work cleanly without 404 errors.

---

## 7. Role-Based Access Control (RBAC) Rules

| Role | Accessible Login | Dashboard Route | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Student** | `/student/login` | `/student/dashboard` | Skill graph matching, applying to internships, Kanban tracking, NOC request, logging 120 hours, viewing gradebook, resume ATS checker. |
| **Employer** | `/employer/login` | `/employer/dashboard` | Corporate verification (CIN/GSTIN), posting internships with required skills, applicant Kanban screening, messaging students, submitting intern evaluations. |
| **Faculty / Admin** | `/admin/login` | `/admin/dashboard` | 3-tier sequential NOC e-signing (Mentor → HOD → Placement Officer), vetting employers, pushing evaluations to gradebook credits, analytics. |

Cross-role logins (e.g. student entering credentials on employer login) are detected, immediately signed out, and rejected with explicit error messaging.
