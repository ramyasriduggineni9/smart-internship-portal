import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface TopBarProps {
  onOpenSignup?: () => void;
}

export default function TopBar({ onOpenSignup }: TopBarProps) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--line)',
      position: 'sticky',
      top: 0,
      zIndex: 200,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Logo */}
        <Link to="/" style={{ fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 18, color: 'var(--accent)', textDecoration: 'none', flexShrink: 0 }}>
          Smart Internship Portal
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 14 }} className="desktop-nav">
          <Link to="/" style={{ padding: '6px 12px', color: 'var(--muted)', textDecoration: 'none', borderRadius: 'var(--radius-sm)' }}>Home</Link>
          <Link to="/#how-it-works" style={{ padding: '6px 12px', color: 'var(--muted)', textDecoration: 'none', borderRadius: 'var(--radius-sm)' }}>How it works</Link>
          <Link to="/#for-students" style={{ padding: '6px 12px', color: 'var(--muted)', textDecoration: 'none', borderRadius: 'var(--radius-sm)' }}>For students</Link>
          <Link to="/#for-employers" style={{ padding: '6px 12px', color: 'var(--muted)', textDecoration: 'none', borderRadius: 'var(--radius-sm)' }}>For employers</Link>
          <Link to="/#for-colleges" style={{ padding: '6px 12px', color: 'var(--muted)', textDecoration: 'none', borderRadius: 'var(--radius-sm)' }}>For colleges</Link>
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {/* Login dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setLoginOpen(o => !o)}
              aria-haspopup="true"
              aria-expanded={loginOpen}
            >
              Log in ▾
            </button>
            {loginOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                minWidth: 180,
                zIndex: 300,
                overflow: 'hidden',
              }}
                onBlur={() => setLoginOpen(false)}
              >
                <Link to="/student/login" style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: 'var(--ink)', textDecoration: 'none' }} onClick={() => setLoginOpen(false)}>
                  🎓 Student
                </Link>
                <Link to="/employer/login" style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: 'var(--ink)', textDecoration: 'none' }} onClick={() => setLoginOpen(false)}>
                  🏢 Employer
                </Link>
                <Link to="/admin/login" style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: 'var(--ink)', textDecoration: 'none' }} onClick={() => setLoginOpen(false)}>
                  🏫 Faculty &amp; Admin
                </Link>
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-sm" onClick={onOpenSignup}>
            Create account
          </button>

          {/* Mobile hamburger */}
          <button
            className="btn btn-ghost btn-sm"
            style={{ display: 'none' }}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-nav + div button[aria-label="Menu"] { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
