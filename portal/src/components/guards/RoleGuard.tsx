import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';

type Role = 'student' | 'employer' | 'admin';

interface RoleGuardProps {
  requiredRole: Role;
  children: React.ReactNode;
}

export default function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const { session, role, loading } = useAuth();
  const { toast } = useToast();
  const [redirected, setRedirected] = React.useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: 'var(--muted)', fontSize: 16 }}>Loading…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to={`/${requiredRole}/login`} replace />;
  }

  if (role !== requiredRole) {
    if (!redirected) {
      setRedirected(true);
      toast('You do not have access to that page', 'error');
    }
    const fallback = role === 'student' || role === 'employer' || role === 'admin'
      ? `/${role}/dashboard`
      : '/student/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
