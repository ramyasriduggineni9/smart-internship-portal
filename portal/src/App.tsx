import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import RoleGuard from './components/guards/RoleGuard';

// ─── Lazy auth pages (placeholders until other workers fill them) ───────────
const Welcome = React.lazy(() => import('./pages/Welcome'));
const StudentLogin = React.lazy(() => import('./pages/auth/StudentLogin'));
const EmployerLogin = React.lazy(() => import('./pages/auth/EmployerLogin'));
const AdminLogin = React.lazy(() => import('./pages/auth/AdminLogin'));

// ─── Student pages ──────────────────────────────────────────────────────────
const StudentDashboard = React.lazy(() => import('./pages/student/Dashboard'));
const StudentProfile = React.lazy(() => import('./pages/student/Profile'));
const StudentFeed = React.lazy(() => import('./pages/student/Feed'));
const StudentSkillGraph = React.lazy(() => import('./pages/student/SkillGraph'));
const StudentApplications = React.lazy(() => import('./pages/student/Applications'));
const StudentNoc = React.lazy(() => import('./pages/student/Noc'));
const StudentHours = React.lazy(() => import('./pages/student/Hours'));
const StudentGradebook = React.lazy(() => import('./pages/student/Gradebook'));
const StudentResume = React.lazy(() => import('./pages/student/Resume'));
const StudentLearning = React.lazy(() => import('./pages/student/Learning'));
const StudentAssistant = React.lazy(() => import('./pages/student/Assistant'));

// ─── Employer pages ─────────────────────────────────────────────────────────
const EmployerDashboard = React.lazy(() => import('./pages/employer/Dashboard'));
const EmployerVerify = React.lazy(() => import('./pages/employer/Verify'));
const EmployerPostRole = React.lazy(() => import('./pages/employer/PostRole'));
const EmployerApplicants = React.lazy(() => import('./pages/employer/Applicants'));
const EmployerEvaluate = React.lazy(() => import('./pages/employer/Evaluate'));

// ─── Admin pages ─────────────────────────────────────────────────────────────
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminApprovals = React.lazy(() => import('./pages/admin/Approvals'));
const AdminCredits = React.lazy(() => import('./pages/admin/Credits'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/Analytics'));
const AdminEmployers = React.lazy(() => import('./pages/admin/Employers'));
const AdminCreateFaculty = React.lazy(() => import('./pages/admin/CreateFaculty'));

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--muted)' }}>
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <React.Suspense fallback={<Spinner />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Welcome />} />
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/employer/login" element={<EmployerLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Student routes */}
              <Route
                path="/student/*"
                element={
                  <RoleGuard requiredRole="student">
                    <Routes>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<StudentDashboard />} />
                      <Route path="profile" element={<StudentProfile />} />
                      <Route path="feed" element={<StudentFeed />} />
                      <Route path="skill-graph" element={<StudentSkillGraph />} />
                      <Route path="applications" element={<StudentApplications />} />
                      <Route path="noc" element={<StudentNoc />} />
                      <Route path="hours" element={<StudentHours />} />
                      <Route path="gradebook" element={<StudentGradebook />} />
                      <Route path="resume" element={<StudentResume />} />
                      <Route path="learning" element={<StudentLearning />} />
                      <Route path="assistant" element={<StudentAssistant />} />
                    </Routes>
                  </RoleGuard>
                }
              />

              {/* Employer routes */}
              <Route
                path="/employer/*"
                element={
                  <RoleGuard requiredRole="employer">
                    <Routes>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<EmployerDashboard />} />
                      <Route path="verify" element={<EmployerVerify />} />
                      <Route path="post-role" element={<EmployerPostRole />} />
                      <Route path="applicants" element={<EmployerApplicants />} />
                      <Route path="evaluate" element={<EmployerEvaluate />} />
                    </Routes>
                  </RoleGuard>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin/*"
                element={
                  <RoleGuard requiredRole="admin">
                    <Routes>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="approvals" element={<AdminApprovals />} />
                      <Route path="credits" element={<AdminCredits />} />
                      <Route path="analytics" element={<AdminAnalytics />} />
                      <Route path="employers" element={<AdminEmployers />} />
                      <Route path="create-faculty" element={<AdminCreateFaculty />} />
                    </Routes>
                  </RoleGuard>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
