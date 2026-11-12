# Smart Internship Portal

[![Institution](https://img.shields.io/badge/Institution-Matrusri%20Engineering%20College-blue.svg)](http://www.matrusri.edu.in)
[![Department](https://img.shields.io/badge/Department-Computer%20Science%20%26%20Engineering-teal.svg)](http://www.matrusri.edu.in)
[![Team](https://img.shields.io/badge/Team-D07-green.svg)](#team-members)
[![Base Paper](https://img.shields.io/badge/IEEE-ICMNWC%202025-orange.svg)](https://doi.org/10.1109/ICMNWC66779.2025.11354307)
[![Supabase](https://img.shields.io/badge/Backend-Supabase%20%2F%20Node.js-3ECF8E.svg)](https://supabase.com)

A data-driven academic internship platform engineered to bridge the gap between classroom learning and industry placement. The system features a **Semantic Skill-Graph Matching Engine** based on an IEEE knowledge-graph foundation, integrated with an end-to-end university internship management lifecycle: automated eligibility screening, verified employer onboarding, real-time Kanban tracking, digital sequential e-signatures, and automated academic credit transfer into institutional gradebooks.

---

## 👥 Team Members (Team D07)

| Sl. No. | Roll Number | Student Name | Role |
| :--- | :--- | :--- | :--- |
| 1 | **1608-24-733-200** | **Ramyasri Duggineni** | Full Stack Development & Skill Graph Architecture |
| 2 | **1608-24-733-235** | **Jyothsna Kanugula** | Frontend UI/UX & Kanban Workflow Design |
| 3 | **1608-24-733-245** | **R. Kalyan** | Backend API, Employer Verification & Database |

**Department of Computer Science and Engineering**  
**Matrusri Engineering College** (Affiliated to Osmania University), Saidabad, Hyderabad - 500059.

---

## 📖 Base Paper Information

- **Title**: *Skill-Based Recommender System for Internship and Industry Hiring using Knowledge Graphs*
- **Conference**: 2025 5th International Conference on Mobile Networks and Wireless Communications (ICMNWC)
- **DOI**: [10.1109/ICMNWC66779.2025.11354307](https://doi.org/10.1109/ICMNWC66779.2025.11354307)
- **Problem Solved**: Traditional keyword matching fails when candidate profiles and role titles use different terminology (e.g., *Python Developer* vs. *Backend Engineer*). The base paper uses semantic relationships and hierarchical dependencies in a knowledge graph to calculate semantic proximity.
- **Our System's Extension**: Extends the recommendation engine into a university-centric lifecycle containing eligibility screening, employer verification, digital approvals, and credit transfers.

---

## 📁 Repository Structure

```
smart-internship-portal/
├── frontend/                                # Frontend Application
│   ├── index.html                           # Welcome Page & Embedded Original Dashboard
│   ├── prototype.html                       # Standalone offline prototype
│   ├── _redirects                           # Netlify SPA routing rules
│   ├── css/
│   │   └── styles.css                       # Master application & landing stylesheet
│   └── js/
│       ├── app.js                           # Core frontend application logic & UI renderer
│       └── supabase.js                      # Supabase auth, modal routing & profile handling
│
├── backend/                                 # Backend REST API Server (Node.js / Express)
│   ├── server.js                            # Express application entry point
│   ├── package.json                         # Dependencies & scripts
│   ├── .env.example                         # Environment configuration template
│   ├── config/
│   │   └── db.js                            # Database / Supabase client configuration
│   ├── controllers/
│   │   ├── authController.js                # Student profile management
│   │   ├── internshipController.js          # Internship postings & eligibility screener
│   │   ├── applicationController.js         # Real-time Kanban application tracker
│   │   ├── approvalController.js            # Sequential digital NOC signatures & credits
│   │   ├── employerController.js            # Corporate CIN & GSTIN verification
│   │   └── skillGraphController.js          # Semantic skill-graph matching engine
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── internshipRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── approvalRoutes.js
│   │   ├── employerRoutes.js
│   │   └── skillGraphRoutes.js
│   └── database/
│       └── schema.sql                       # PostgreSQL / Supabase SQL schema with RLS
│
├── data/                                    # Datasets & Ontology
│   ├── archive.zip                          # Naukri.com real-world job postings dataset
│   ├── tabiya-open-dataset-main.zip         # ESCO skills taxonomy and relationships
│   └── README.md                            # Dataset documentation
│
├── docs/                                    # Project Documentation
│   ├── smp.pdf                              # Visual prototype and architecture specification
│   ├── Smart Internship Portal.md           # Mini-project synopsis
│   └── ARCHITECTURE.md                      # Detailed technical architecture & viva notes
│
├── index.html                               # Root launcher / instant redirect to frontend
├── netlify.toml                             # Netlify automated deployment configuration
├── .gitignore                               # Standard git ignore file
└── README.md                                # Master project documentation
```

---

## ⚡ Core Features & Modules

1. **Modern Welcome / Landing Page & Dialog Flow**:
   - Modern, responsive landing page with hero section, 6-step *How It Works* interactive pipeline, platform features, institutional information, stakeholder benefits, and CTA banner.
   - Secure dialog modals for **Student Login**, **Create Account** (with confirmation & college fields), and **Password Reset** powered by Supabase Auth.
   - Smooth transition into the original dashboard upon authentication, and a one-click **Sign out** returning to the Welcome Page.
2. **Semantic Skill-Graph Matching Engine**:
   - Represents skills as graph nodes and semantic affinities as weighted edges.
   - Computes transitive closure to match candidates with roles (e.g., Python $\rightarrow$ Django/Flask at 80% match).
2. **Automated Eligibility Screener**:
   - Instantly checks minimum CGPA and prerequisites (e.g., DBMS for backend, Web Tech for full-stack).
3. **Verified Employer Onboarding**:
   - Authenticates MCA Corporate Identification Number (CIN, 21 characters).
   - Validates GSTIN (15 characters) and enforces corporate-domain email validation (blocking `@gmail.com`, `@yahoo.com`).
4. **Real-Time Kanban Application Tracker**:
   - Visual Kanban pipeline tracking: `Applied` $\rightarrow$ `Under Review` $\rightarrow$ `Interview Scheduled` $\rightarrow$ `Selected` $\rightarrow$ `Rejected`.
5. **Digital Workflows & E-Signatures**:
   - Sequential chain-of-command approval for No Objection Certificates (NOC): **Faculty Mentor** $\rightarrow$ **HOD** $\rightarrow$ **Placement Officer**.
   - Generates tamper-evident cryptographic signature hashes.
6. **Automated Academic Credit Transfer**:
   - Tracks verified internship hours (160h required).
   - Automatically synchronizes employer evaluation scores directly into the institutional gradebook for course code `CSE-INT`.
7. **Smart Resume Optimizer & ATS Analyzer**:
   - Real-time resume keyword density analysis against job requirements, flagging specific skill gaps and suggesting relevant university courses.

---

## 🚀 Getting Started

### 1. Running the Frontend
The frontend runs cleanly in any modern web browser without requiring a heavy build toolchain:
- **Direct Launch**: Open `frontend/index.html` in your web browser, or open root `index.html`.
- **Using Live Server (VS Code / Antigravity IDE)**:
  - Right-click `frontend/index.html` and select **"Open with Live Server"**.
  - Navigate to `http://localhost:5500/frontend/index.html`.

### 2. Running the Backend Server
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start the API server
npm start
# or for development mode:
npm run dev
```
The API server will run at `http://localhost:5000`.

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

1. Create a project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the SQL script located at:
   ```
   backend/database/schema.sql
   ```
4. Copy your **Project URL** and **Publishable (anon) Key** into:
   - `frontend/js/supabase.js`
   - `backend/.env`

---

## 📡 REST API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/skills/graph` | Retrieve nodes and edges for the knowledge graph |
| `POST` | `/api/skills/match` | Compute semantic match scores and skill gaps |
| `GET` | `/api/internships` | List internships with personalized match scores & eligibility |
| `POST` | `/api/internships` | Post a new internship opportunity |
| `GET` | `/api/applications` | Retrieve all applications with Kanban status |
| `POST` | `/api/applications` | Apply for an internship position |
| `PATCH` | `/api/applications/:id/stage` | Move applicant through Kanban stages |
| `GET` | `/api/approvals/noc` | Check status of sequential digital NOC signatures |
| `POST` | `/api/approvals/noc/sign` | Sign NOC (Mentor, HOD, Placement Officer) |
| `POST` | `/api/approvals/credits/push-gradebook` | Push approved internship credits to university gradebook |
| `POST` | `/api/employers/verify` | Run CIN/GSTIN and domain verification on employer registration |

---

## 📜 License

This project is created for academic research and presentation by **Team D07**, Department of Computer Science and Engineering, Matrusri Engineering College.
All rights reserved.

