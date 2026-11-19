import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--line)',
      padding: '32px 24px',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 18, color: 'var(--accent)', marginBottom: 6 }}>
              Smart Internship Portal
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 280 }}>
              Connecting students, employers, and colleges with AI-powered skill matching.
            </p>
          </div>
          <nav style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', fontSize: 14 }}>
            <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Home</Link>
            <Link to="/#how-it-works" style={{ color: 'var(--muted)', textDecoration: 'none' }}>How it works</Link>
            <Link to="/#for-students" style={{ color: 'var(--muted)', textDecoration: 'none' }}>For students</Link>
            <Link to="/#for-employers" style={{ color: 'var(--muted)', textDecoration: 'none' }}>For employers</Link>
            <Link to="/#for-colleges" style={{ color: 'var(--muted)', textDecoration: 'none' }}>For colleges</Link>
          </nav>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          © {year} Smart Internship Portal. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
