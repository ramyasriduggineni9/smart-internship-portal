# Technical Architecture & System Specification

## 1. System Overview
**Smart Internship Portal** is a full-stack, data-driven academic internship lifecycle ecosystem designed and developed for the Department of Computer Science and Engineering at Matrusri Engineering College.

### Team Members (Team D07)
- **Ramyasri Duggineni** (Roll No: 1608-24-733-200)
- **Jyothsna Kanugula** (Roll No: 1608-24-733-235)
- **R. Kalyan** (Roll No: 1608-24-733-245)

---

## 2. Base Paper Alignment
- **Title**: *Skill-Based Recommender System for Internship and Industry Hiring using Knowledge Graphs*
- **Conference**: IEEE ICMNWC 2025 (5th International Conference on Mobile Networks and Wireless Communications)
- **DOI**: `10.1109/ICMNWC66779.2025.11354307`
- **Core Contribution**: Replaces rigid keyword-matching with a knowledge-graph-driven recommendation engine using semantic transitive paths between complementary skills.
- **Our Enhancement / Gap Addressed**: Extending the semantic matching core into a comprehensive university-centric lifecycle containing:
  1. Automated CGPA & prerequisite screening
  2. Verified employer onboarding (CIN & GSTIN vetting)
  3. Real-time Kanban application tracker
  4. Digital e-signature chain for No Objection Certificates (NOC)
  5. Direct gradebook sync for academic credit transfer

---

## 3. High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 FRONTEND (UI)                                  |
|   - Supabase Auth Gate (Student Sign Up & Login)                                |
|   - Student Dashboard (Interactive Knowledge Graph, Job Feed, ATS Resume)       |
|   - Employer Dashboard (Post Jobs, Applicant Review, Verification Submission)    |
|   - Faculty & Admin Panel (Digital NOC Signing Chain, Placement Analytics)      |
+---------------------------------------+-----------------------------------------+
                                        |
                             REST APIs / Supabase Client
                                        |
+---------------------------------------v-----------------------------------------+
|                              BACKEND / API LAYER                               |
|   - Auth & Profile Controller                                                   |
|   - Semantic Skill-Graph Matching Engine (Floyd-Warshall Transitive Closure)   |
|   - Automated Eligibility Screener (CGPA & Course Prerequisite Validation)     |
|   - Real-Time Kanban Application Tracker                                       |
|   - Sequential Digital Signature Engine (Mentor -> HOD -> Placement Officer)   |
|   - Employer Vetting Service (MCA CIN & GSTIN regex + domain match)            |
|   - Academic Credit Transfer Service                                           |
+---------------------------------------+-----------------------------------------+
                                        |
+---------------------------------------v-----------------------------------------+
|                             DATA & PERSISTENCE                                 |
|   - Supabase / PostgreSQL (Students, Employers, Jobs, Applications, NOCs)      |
|   - Datasets: Naukri.com Jobs & Tabiya ESCO Skills Taxonomy Ontology          |
+---------------------------------------------------------------------------------+
```

---

## 4. Key Modules & Technical Specifications

### Module 1: Semantic Skill-Graph Matching Engine
Instead of binary keyword matching, skills are mapped into an interconnected graph with edge weights representing skill affinity $w \in [0, 1]$.
The transitive similarity between skill $i$ and skill $j$ across any intermediary skill $k$ is calculated as:
$$M_{ij} = \max_k (M_{ik} \cdot M_{kj})$$
This allows a student with `Python` to receive an 80% affinity match for `Django` or `Flask` postings.

### Module 2: Automated Eligibility Screener
Before an application can be submitted, the screener validates:
- Student's current CGPA $\ge$ Job's minimum CGPA threshold.
- Student's completed courses contain all mandatory prerequisites (e.g., `DBMS` for backend roles).

### Module 3: Verified Employer Onboarding
To prevent scam or ghost internships:
- Corporate Identity Number (CIN): 21-character structure validated via `/^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/`.
- GSTIN: 15-character tax identifier validated via `/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/`.
- Domain Vetting: Free email addresses (`@gmail.com`, `@yahoo.com`) are rejected; the HR email domain must match the company's verified website domain.

### Module 4: Digital Workflows & E-Signatures
Eliminates physical paperwork by routing digital No Objection Certificates (NOCs) sequentially through:
1. Faculty Mentor
2. Head of Department (HOD)
3. Placement Officer
Each signature computes a cryptographic tamper-evident hash token.

### Module 5: Automated Academic Credit Transfer
Tracks verified internship hours logged by students (target: 160 hours). Once the supervisor submits the performance evaluation score, the system automatically calculates the letter grade and syncs the 2 academic credits directly into the university gradebook.
