import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { STUDENT_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

interface GradebookItem {
  id: string;
  course: string;
  credits: number;
  grade: string;
  awarded_at: string;
}

interface EvaluationItem {
  id: string;
  score: number;
  notes: string;
  submitted_at: string;
  application?: {
    internship?: {
      title: string;
      employer?: {
        company: string;
      };
    };
  };
}

export default function StudentGradebook() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [grades, setGrades] = useState<GradebookItem[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    loadGradebook();
  }, [profile?.id]);

  async function loadGradebook() {
    setLoading(true);
    try {
      // 1. Fetch gradebook records
      const { data: gData, error: gErr } = await supabase
        .from('gradebook')
        .select('*')
        .eq('student_id', profile!.id);
      if (gErr) throw gErr;
      setGrades(gData || []);

      // 2. Fetch completed evaluations for this student
      const { data: apps } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', profile!.id);

      if (apps && apps.length > 0) {
        const appIds = apps.map(a => a.id);
        const { data: evalData } = await supabase
          .from('evaluations')
          .select('*, application:applications(internship:internships(title, employer:employers(company)))')
          .in('application_id', appIds);
        setEvaluations((evalData || []) as unknown as EvaluationItem[]);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load gradebook', 'error');
    } finally {
      setLoading(false);
    }
  }

  const totalCredits = grades.reduce((acc, curr) => acc + (curr.credits || 0), 0);

  return (
    <AppShell navItems={STUDENT_NAV}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Academic Gradebook & Credits</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Automatic credit transfer awarded upon verified employer evaluation.
        </p>

        {/* Summary Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Total Internship Credits Earned
            </div>
            <div className="mono" style={{ fontSize: 36, fontWeight: 700, margin: '8px 0', color: totalCredits > 0 ? 'var(--good)' : 'var(--muted)' }}>
              {totalCredits} <span style={{ fontSize: 16, fontWeight: 400 }}>Credits</span>
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {totalCredits > 0 ? 'Transferred to institutional record' : 'Pending internship evaluation'}
            </div>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
              Credit Transfer Grading Scale
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 13 }}>
              <div><strong style={{ color: 'var(--good)' }}>A+</strong>: ≥ 85 pts</div>
              <div><strong style={{ color: 'var(--accent)' }}>A</strong>: ≥ 70 pts</div>
              <div><strong style={{ color: 'var(--warn)' }}>B</strong>: ≥ 60 pts</div>
              <div><strong style={{ color: 'var(--bad)' }}>C</strong>: &lt; 60 pts</div>
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
              Standard 2 academic credits allocated per completed 120-hour verified internship.
            </div>
          </div>
        </div>

        {/* Gradebook Table */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="section-title">Institutional Gradebook Entries</h3>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>Loading gradebook…</div>
          ) : grades.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <p className="muted" style={{ fontSize: 14, marginBottom: 8 }}>
                No academic credits recorded yet in your institutional gradebook.
              </p>
              <p className="muted" style={{ fontSize: 13 }}>
                Complete 120 hours of work, obtain your employer evaluation, and your college admin will push the grade here.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Credits Awarded</th>
                    <th>Final Grade</th>
                    <th>Date Awarded</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map(g => (
                    <tr key={g.id}>
                      <td className="mono" style={{ fontWeight: 700 }}>{g.course}</td>
                      <td className="mono">{g.credits} Credits</td>
                      <td>
                        <span className="chip" style={{
                          background: g.grade === 'A+' || g.grade === 'A' ? 'var(--good-soft)' : 'var(--warn-soft)',
                          color: g.grade === 'A+' || g.grade === 'A' ? 'var(--good)' : 'var(--warn)',
                          fontFamily: 'var(--f-mono)',
                          fontSize: 14
                        }}>
                          {g.grade}
                        </span>
                      </td>
                      <td className="mono" style={{ fontSize: 13 }}>{new Date(g.awarded_at).toLocaleDateString()}</td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--good)', fontWeight: 600 }}>✓ Verified</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Employer Evaluations List */}
        <div className="card">
          <h3 className="section-title">Submitted Employer Evaluations</h3>
          {evaluations.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, padding: '12px 0' }}>
              No employer evaluations received yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {evaluations.map(ev => (
                <div key={ev.id} style={{
                  padding: 14,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  background: 'var(--bg)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: 15 }}>{ev.application?.internship?.title || 'Internship'}</h4>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {ev.application?.internship?.employer?.company || 'Employer'}
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                      {ev.score} / 100 pts
                    </div>
                  </div>
                  {ev.notes && (
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                      "{ev.notes}"
                    </div>
                  )}
                  <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                    Submitted on: {new Date(ev.submitted_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
