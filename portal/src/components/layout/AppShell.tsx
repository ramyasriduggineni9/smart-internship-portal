import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export interface NavItem {
  icon: string;
  label: string;
  to: string;
}

interface AppShellProps {
  navItems: NavItem[];
  children: React.ReactNode;
}

export default function AppShell({ navItems, children }: AppShellProps) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const rolePillColor = role === 'admin' ? 'var(--bad-soft)' : role === 'employer' ? 'var(--warn-soft)' : 'var(--accent-soft)';
  const rolePillText = role === 'admin' ? 'var(--bad)' : role === 'employer' ? 'var(--warn)' : 'var(--accent)';

  return (
    <div className="app-shell" style={{ flexDirection: 'column' }}>
      {/* Top bar */}
      <header className="app-topbar">
        <Link to="/" style={{ fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 16, color: 'var(--accent)', textDecoration: 'none' }}>
          Smart Internship Portal
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
            {profile?.full_name ?? profile?.email ?? 'User'}
          </span>
          {role && (
            <span style={{ background: rolePillColor, color: rolePillText, borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '2px 10px', textTransform: 'capitalize' }}>
              {role}
            </span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Side nav */}
        <nav className="app-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => isActive ? 'active' : ''}
              end={item.to.endsWith('dashboard')}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Main */}
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
