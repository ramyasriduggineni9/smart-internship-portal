import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { STUDENT_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { matchScore } from '../../lib/skillGraph';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [skills, setSkills] = useState<string[]>([]);
  const [internshipsCount, setInternshipsCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [appsCount, setAppsCount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    loadDashboardData();
  }, [profile?.id]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // 1. Fetch student skills
      const { data: skillRows } = await supabase
        .from('student_skills')
        .select('skill_name')
        .eq('student_id', profile!.id);
      const studentSkillList = (skillRows || []).map(r => r.skill_name);
      setSkills(studentSkillList);

      // 2. Fetch open internships
      const { data: intRows } = await supabase
        .from('internships')
        .select('*')
        .eq('status', 'open');
      const allInternships = intRows || [];
      setInternshipsCount(allInternships.length);

      // Calculate matches with score >= 0.5
      let matched = 0;
      for (const item of allInternships) {
        const score = matchScore(studentSkillList, item.required_skills || []).score;
        if (score >= 0.5) matched++;
      }
      setMatchedCount(matched);

      // 3. Fetch applications
      const { data: appRows } = await supabase
        .from('applications')
        .select('id, stage')
        .eq('student_id', profile!.id);
      setAppsCount(appRows?.length || 0);

      // 4. Fetch total hours logged
      const { data: hourRows } = await supabase
        .from('hours_log')
        .select('hours')
        .eq('student_id', profile!.id);
      const sum = (hourRows || []).reduce((acc, curr) => acc + (curr.hours || 0), 0);
      setTotalHours(sum);

      // 5. Fetch gradebook
      const { data: gradeRows } = await supabase
        .from('gradebook')
        .select('credits')
        .eq('student_id', profile!.id);
      if (gradeRows && gradeRows.length > 0) {
        setCredits(gradeRows.reduce((a, b) => a + (b.credits || 0), 0));
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  // Profile completeness calculation
  const fields = [
    Boolean(profile?.full_name),
    Boolean(profile?.college),
    Boolean(profile?.roll_number),
    Boolean(profile?.department),
    Boolean(profile?.cgpa && Number(profile.cgpa) > 0),
    skills.length > 0,
    Boolean(profile?.github || profile?.linkedin),
  ];
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  return (
    <AppShell navItems={STUDENT_NAV}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>
              Welcome, {String(profile?.full_name || 'Student')} 👋
            </h1>
            <p className="muted" style={{ fontSize: 14 }}>
              {profile?.college ? `${String(profile.college)}` : 'Complete your profile to unlock verified internship matches'}
              {profile?.roll_number ? ` • Roll No: ${String(profile.roll_number)}` : ''}
              {profile?.department ? ` • Dept: ${String(profile.department)}` : ''}
            </p>
          </div>

          <Link to="/student/feed" className="btn btn-primary">
            Explore Internships →
          </Link>
        </div>

        {/* Profile Completeness Card */}
        <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Profile Completeness</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: completeness === 100 ? 'var(--good)' : 'var(--accent)' }}>
              {completeness}%
            </span>
          </div>
          <div className="score-bar">
            <div className="score-bar-fill" style={{ width: `${completeness}%` }} />
          </div>
          {completeness < 100 && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Add your college, skills and CGPA for better matching.</span>
              <Link to="/student/profile" style={{ fontWeight: 600 }}>Update Profile →</Link>
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 28
        }}>
          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Matched Internships
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: 'var(--accent)' }}>
              {matchedCount} <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 400 }}>/ {internshipsCount}</span>
            </div>
            <Link to="/student/feed" style={{ fontSize: 13 }}>View Skill Matches →</Link>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Active Applications
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: 'var(--ink)' }}>
              {appsCount}
            </div>
            <Link to="/student/applications" style={{ fontSize: 13 }}>View Kanban Board →</Link>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Logged Hours
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: totalHours >= 120 ? 'var(--good)' : 'var(--warn)' }}>
              {totalHours} <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 400 }}>/ 120 hrs</span>
            </div>
            <Link to="/student/hours" style={{ fontSize: 13 }}>Log Work Hours →</Link>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Academic Credits
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: credits ? 'var(--good)' : 'var(--muted)' }}>
              {credits !== null ? `${credits} Credits` : 'Pending'}
            </div>
            <Link to="/student/gradebook" style={{ fontSize: 13 }}>View Gradebook →</Link>
          </div>
        </div>

        {/* Quick Access Tools */}
        <h3 className="section-title">Internship Workflow & Tools</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16
        }}>
          <Link to="/student/skill-graph" className="card" style={{ textDecoration: 'none', transition: 'border-color 0.2s' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🕸️</div>
            <h4 style={{ fontSize: 16, marginBottom: 4 }}>Skill Graph Explorer</h4>
            <p className="muted" style={{ fontSize: 13 }}>
              Interactive 22-node network showing your current skills and paths to target internships.
            </p>
          </Link>

          <Link to="/student/noc" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✍️</div>
            <h4 style={{ fontSize: 16, marginBottom: 4 }}>Paperless NOC Chain</h4>
            <p className="muted" style={{ fontSize: 13 }}>
              Track 3-signatory approvals (Mentor → HOD → Placement Officer) with verified digital signatures.
            </p>
          </Link>

          <Link to="/student/resume" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
            <h4 style={{ fontSize: 16, marginBottom: 4 }}>Resume ATS Checker</h4>
            <p className="muted" style={{ fontSize: 13 }}>
              Calculate instant ATS score out of 100 against any open internship and get skill gap tips.
            </p>
          </Link>

          <Link to="/student/assistant" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🤖</div>
            <h4 style={{ fontSize: 16, marginBottom: 4 }}>AI Internship Assistant</h4>
            <p className="muted" style={{ fontSize: 13 }}>
              Ask about best matches, eligibility checks, NOC status updates, or skill preparation.
            </p>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
