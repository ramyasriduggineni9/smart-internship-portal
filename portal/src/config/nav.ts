import { NavItem } from '../components/layout/AppShell';

export const STUDENT_NAV: NavItem[] = [
  { icon: '📊', label: 'Dashboard', to: '/student/dashboard' },
  { icon: '👤', label: 'Profile & Skills', to: '/student/profile' },
  { icon: '💼', label: 'Internships', to: '/student/feed' },
  { icon: '🕸️', label: 'Skill Graph', to: '/student/skill-graph' },
  { icon: '📋', label: 'Applications', to: '/student/applications' },
  { icon: '✍️', label: 'NOC Approval', to: '/student/noc' },
  { icon: '⏱️', label: 'Log Hours', to: '/student/hours' },
  { icon: '🎓', label: 'Gradebook', to: '/student/gradebook' },
  { icon: '📄', label: 'Resume ATS', to: '/student/resume' },
  { icon: '📚', label: 'Learning', to: '/student/learning' },
  { icon: '🤖', label: 'AI Assistant', to: '/student/assistant' },
];

export const EMPLOYER_NAV: NavItem[] = [
  { icon: '📊', label: 'Dashboard', to: '/employer/dashboard' },
  { icon: '🏢', label: 'Company Verification', to: '/employer/verify' },
  { icon: '➕', label: 'Post Internship', to: '/employer/post-role' },
  { icon: '👥', label: 'Applicants', to: '/employer/applicants' },
  { icon: '⭐', label: 'Evaluate Interns', to: '/employer/evaluate' },
];

export const ADMIN_NAV: NavItem[] = [
  { icon: '📊', label: 'Dashboard', to: '/admin/dashboard' },
  { icon: '✍️', label: 'NOC Approvals', to: '/admin/approvals' },
  { icon: '🎓', label: 'Credit Transfer', to: '/admin/credits' },
  { icon: '🏢', label: 'Verify Employers', to: '/admin/employers' },
  { icon: '📈', label: 'Analytics', to: '/admin/analytics' },
  { icon: '👥', label: 'Manage Faculty', to: '/admin/create-faculty' },
];
