import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { EMPLOYER_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function EmployerDashboard() {
  const { profile } = useAuth();
  const [employer, setEmployer] = useState<any>(null);
  const [postings, setPostings] = useState<any[]>([]);
  const [applicantCount, setApplicantCount] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [readyForEvalCount, setReadyForEvalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    loadDashboard();
  }, [profile?.id]);

  async function loadDashboard() {
    setLoading(true);
    try {
      // 1. Fetch employer record
      const { data: empData } = await supabase
        .from('employers')
        .select('*')
        .eq('id', profile!.id)
        .maybeSingle();
      setEmployer(empData);

      // 2. Fetch internships posted by this employer
      const { data: intData } = await supabase
        .from('internships')
        .select('*')
        .eq('employer_id', profile!.id)
        .order('created_at', { ascending: false });
      const myInternships = intData || [];
      setPostings(myInternships);

      // 3. Fetch applications to this employer's postings
      if (myInternships.length > 0) {
        const intIds = myInternships.map(i => i.id);
        const { data: appData } = await supabase
          .from('applications')
          .select('id, stage')
          .in('internship_id', intIds);

        const allApps = appData || [];
        setApplicantCount(allApps.length);
        setSelectedCount(allApps.filter(a => a.stage === 'Selected').length);

        // 4. Check interns with 120+ hours
        const selectedIds = allApps.filter(a => a.stage === 'Selected').map(a => a.id);
        if (selectedIds.length > 0) {
          const { data: hourRows } = await supabase
            .from('hours_log')
            .select('application_id, hours')
            .in('application_id', selectedIds);

          const appHoursMap: Record<string, number> = {};
          (hourRows || []).forEach(h => {
            appHoursMap[h.application_id] = (appHoursMap[h.application_id] || 0) + (h.hours || 0);
          });

          // Check if already evaluated
          const { data: evalRows } = await supabase
            .from('evaluations')
            .select('application_id')
            .in('application_id', selectedIds);
          const evaluatedIds = (evalRows || []).map(e => e.application_id);

          const ready = selectedIds.filter(id => (appHoursMap[id] || 0) >= 120 && !evaluatedIds.includes(id));
          setReadyForEvalCount(ready.length);
        }
      }
    } catch (err) {
      console.error('Failed to load employer dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const isVerified = employer?.status === 'verified' || profile?.employer_status === 'verified';
  const isPending = !isVerified && (employer?.status === 'pending' || profile?.employer_status === 'pending');
  const isBlocked = employer?.status === 'blocked' || profile?.employer_status === 'blocked';

  return (
    <AppShell navItems={EMPLOYER_NAV}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Welcome Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 className="page-title" style={{ marginBottom: 0 }}>
                {employer?.company || profile?.full_name || 'Employer Portal'}
              </h1>
              <span className="chip" style={{
                background: isVerified ? 'var(--good-soft)' : isBlocked ? 'var(--bad-soft)' : 'var(--warn-soft)',
                color: isVerified ? 'var(--good)' : isBlocked ? 'var(--bad)' : 'var(--warn)',
                fontWeight: 700
              }}>
                {isVerified ? '✓ Verified Organization' : isBlocked ? '✗ Blocked' : '● Verification Pending'}
              </span>
            </div>
            <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
              {isVerified
                ? 'Your organization credentials have been verified. You can publish roles and hire interns.'
                : 'Complete corporate verification with CIN and GSTIN to publish internship openings.'}
            </p>
          </div>

          <div>
            {isVerified ? (
              <Link to="/employer/post-role" className="btn btn-primary">
                + Post New Internship
              </Link>
            ) : (
              <Link to="/employer/verify" className="btn btn-secondary">
                Submit Verification Documents →
              </Link>
            )}
          </div>
        </div>

        {/* Verification Alert Banner if not verified */}
        {!isVerified && (
          <div style={{
            background: 'var(--warn-soft)',
            border: '1px solid var(--warn)',
            color: 'var(--warn)',
            padding: '16px 20px',
            borderRadius: 'var(--radius)',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                Corporate Verification In Progress
              </div>
              <div style={{ fontSize: 13 }}>
                Under institutional guidelines, only verified companies with valid CIN/GSTIN can publish internships to students.
              </div>
            </div>
            <Link to="/employer/verify" className="btn btn-sm btn-primary">
              View Verification Status →
            </Link>
          </div>
        )}

        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 28
        }}>
          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Active Postings
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: 'var(--ink)' }}>
              {postings.length}
            </div>
            <Link to="/employer/post-role" style={{ fontSize: 13 }}>Manage Roles →</Link>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Total Applicants
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: 'var(--accent)' }}>
              {applicantCount}
            </div>
            <Link to="/employer/applicants" style={{ fontSize: 13 }}>View Kanban Pipeline →</Link>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Selected Interns
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: 'var(--good)' }}>
              {selectedCount}
            </div>
            <Link to="/employer/applicants" style={{ fontSize: 13 }}>Track Intern Progress →</Link>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Pending Evaluations (120 hrs)
            </div>
            <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '8px 0', color: readyForEvalCount > 0 ? 'var(--good)' : 'var(--muted)' }}>
              {readyForEvalCount}
            </div>
            <Link to="/employer/evaluate" style={{ fontSize: 13 }}>Submit Evaluations →</Link>
          </div>
        </div>

        {/* Recent Openings Table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>Internship Openings</h3>
            {isVerified && (
              <Link to="/employer/post-role" className="btn btn-secondary btn-sm">
                + Create Opening
              </Link>
            )}
          </div>

          {postings.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, padding: '16px 0' }}>
              No internship openings created yet.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Required Skills</th>
                    <th>Min CGPA</th>
                    <th>Stipend</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {postings.map(job => (
                    <tr key={job.id}>
                      <td style={{ fontWeight: 600 }}>{job.title}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(job.required_skills || []).map((s: string) => (
                            <span key={s} className="chip chip-neutral" style={{ fontSize: 11, padding: '2px 8px' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="mono">{job.min_cgpa || 'None'}</td>
                      <td>{job.stipend || 'Stipend'}</td>
                      <td>
                        <span className="chip" style={{
                          background: job.status === 'open' ? 'var(--good-soft)' : 'var(--warn-soft)',
                          color: job.status === 'open' ? 'var(--good)' : 'var(--warn)'
                        }}>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
