import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { ADMIN_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [pendingNocs, setPendingNocs] = useState(0);
  const [pendingEmployers, setPendingEmployers] = useState(0);
  const [pendingCredits, setPendingCredits] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      // 1. Pending NOCs
      const { data: nocData } = await supabase.from('noc_requests').select('id');
      const { data: sigData } = await supabase.from('noc_signatures').select('noc_id');
      const sigsCountByNoc: Record<string, number> = {};
      (sigData || []).forEach(s => {
        sigsCountByNoc[s.noc_id] = (sigsCountByNoc[s.noc_id] || 0) + 1;
      });
      const pendingNocCount = (nocData || []).filter(n => (sigsCountByNoc[n.id] || 0) < 3).length;
      setPendingNocs(pendingNocCount);

      // 2. Pending Employers
      const { data: empData } = await supabase
        .from('employers')
        .select('id')
        .eq('status', 'pending');
      setPendingEmployers(empData?.length || 0);

      // 3. Evaluations ready to be pushed to gradebook
      const { data: evalData } = await supabase.from('evaluations').select('application_id, application:applications(student_id)');
      const { data: gradeData } = await supabase.from('gradebook').select('student_id');
      const gradedStudents = new Set((gradeData || []).map(g => g.student_id));
      const uncredited = (evalData || []).filter(e => {
        const sid = (e.application as any)?.student_id;
        return sid && !gradedStudents.has(sid);
      }).length;
      setPendingCredits(uncredited);

      // 4. Total students
      const { data: stData } = await supabase.from('profiles').select('id').eq('role', 'student');
      setTotalStudents(stData?.length || 0);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const facultyTitle = profile?.faculty_title || 'Administrator';

  return (
    <AppShell navItems={ADMIN_NAV}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="page-title" style={{ marginBottom: 0 }}>
                {String(profile?.full_name || 'Admin & Faculty Console')}
              </h1>
              <span className="chip" style={{ background: 'var(--bad-soft)', color: 'var(--bad)', fontWeight: 700 }}>
                {String(facultyTitle)}
              </span>
            </div>
            <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
              Institutional governance dashboard for NOC digital approvals, corporate vetting, and academic credit transfer.
            </p>
          </div>

          <Link to="/admin/approvals" className="btn btn-primary">
            Open Approvals Queue →
          </Link>
        </div>

        {/* Metrics Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 28
        }}>
          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Pending NOC Signatures
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: pendingNocs > 0 ? 'var(--warn)' : 'var(--ink)' }}>
              {pendingNocs}
            </div>
            <Link to="/admin/approvals" style={{ fontSize: 13 }}>Review & E-Sign →</Link>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Pending Employers
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: pendingEmployers > 0 ? 'var(--warn)' : 'var(--ink)' }}>
              {pendingEmployers}
            </div>
            <Link to="/admin/employers" style={{ fontSize: 13 }}>Verify Companies →</Link>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Credits to Transfer
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: pendingCredits > 0 ? 'var(--accent)' : 'var(--ink)' }}>
              {pendingCredits}
            </div>
            <Link to="/admin/credits" style={{ fontSize: 13 }}>Push to Gradebook →</Link>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Registered Students
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: 'var(--good)' }}>
              {totalStudents}
            </div>
            <Link to="/admin/analytics" style={{ fontSize: 13 }}>View Analytics →</Link>
          </div>
        </div>

        {/* Operational Modules */}
        <h3 className="section-title">Institutional Management Modules</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16
        }}>
          <Link to="/admin/approvals" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✍️</div>
            <h4 style={{ fontSize: 16, marginBottom: 4 }}>Sequential NOC Approvals</h4>
            <p className="muted" style={{ fontSize: 13 }}>
              Execute role-specific digital signatures (Mentor → HOD → Placement Officer) with SHA-256 integrity verification.
            </p>
          </Link>

          <Link to="/admin/credits" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🎓</div>
            <h4 style={{ fontSize: 16, marginBottom: 4 }}>Credit Transfer Management</h4>
            <p className="muted" style={{ fontSize: 13 }}>
              Convert completed employer evaluation scores into institutional letter grades and award 2 credits.
            </p>
          </Link>

          <Link to="/admin/employers" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🏢</div>
            <h4 style={{ fontSize: 16, marginBottom: 4 }}>Employer Vetting & Verification</h4>
            <p className="muted" style={{ fontSize: 13 }}>
              Review government CIN and GSTIN filings to approve or block hiring organizations.
            </p>
          </Link>

          <Link to="/admin/create-faculty" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
            <h4 style={{ fontSize: 16, marginBottom: 4 }}>Faculty & Role Assignments</h4>
            <p className="muted" style={{ fontSize: 13 }}>
              Configure Mentor, HOD, and Placement Officer titles and inspect role authorization records.
            </p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
