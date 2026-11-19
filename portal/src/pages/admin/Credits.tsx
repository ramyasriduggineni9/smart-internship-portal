import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { ADMIN_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

interface EvalRow {
  id: string;
  application_id: string;
  score: number;
  notes: string;
  submitted_at: string;
  application: {
    student_id: string;
    student: {
      id: string;
      full_name: string;
      college: string;
      roll_number: string;
    };
    internship: {
      title: string;
      employer?: {
        company: string;
      };
    };
  };
}

export default function AdminCredits() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [evaluations, setEvaluations] = useState<EvalRow[]>([]);
  const [transferredStudentIds, setTransferredStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushingId, setPushingId] = useState<string | null>(null);

  useEffect(() => {
    loadCreditData();
  }, []);

  async function loadCreditData() {
    setLoading(true);
    try {
      // 1. Fetch evaluations
      const { data: evalRows, error } = await supabase
        .from('evaluations')
        .select('*, application:applications(student_id, student:profiles(id, full_name, college, roll_number), internship:internships(title, employer:employers(company)))')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setEvaluations((evalRows || []) as unknown as EvalRow[]);

      // 2. Fetch existing gradebook entries
      const { data: gradeRows } = await supabase
        .from('gradebook')
        .select('student_id');
      const studentIds = (gradeRows || []).map(g => g.student_id);
      setTransferredStudentIds(studentIds);
    } catch (err: any) {
      toast(err.message || 'Failed to load credit transfer records', 'error');
    } finally {
      setLoading(false);
    }
  }

  function computeGrade(score: number): string {
    if (score >= 85) return 'A+';
    if (score >= 70) return 'A';
    if (score >= 60) return 'B';
    return 'C';
  }

  const handlePushToGradebook = async (ev: EvalRow) => {
    const studentId = ev.application?.student_id;
    if (!studentId) return;

    setPushingId(ev.id);
    const grade = computeGrade(ev.score);

    try {
      const { error } = await supabase.from('gradebook').upsert({
        student_id: studentId,
        course: 'CSE-INT',
        credits: 2,
        grade,
        awarded_at: new Date().toISOString()
      });

      if (error) throw error;

      toast(`Successfully transferred 2 credits (${grade}) to ${ev.application?.student?.full_name}'s gradebook!`, 'success');
      setTransferredStudentIds(prev => [...prev, studentId]);
    } catch (err: any) {
      toast(err.message || 'Failed to award credits', 'error');
    } finally {
      setPushingId(null);
    }
  };

  return (
    <AppShell navItems={ADMIN_NAV}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Academic Credit Transfer Console</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Convert verified employer evaluations into official university transcript credits.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            Loading records…
          </div>
        ) : evaluations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <p className="muted">No employer evaluations recorded yet.</p>
          </div>
        ) : (
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Student & Institution</th>
                    <th>Internship Role & Company</th>
                    <th>Evaluation Score</th>
                    <th>Calculated Grade</th>
                    <th>Credits</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map(ev => {
                    const studentId = ev.application?.student_id;
                    const isTransferred = transferredStudentIds.includes(studentId);
                    const grade = computeGrade(ev.score);

                    return (
                      <tr key={ev.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{ev.application?.student?.full_name || 'Student'}</div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {ev.application?.student?.college || 'College'} • {ev.application?.student?.roll_number || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div>{ev.application?.internship?.title}</div>
                          <div className="muted" style={{ fontSize: 12 }}>
                            {ev.application?.internship?.employer?.company || 'Employer'}
                          </div>
                        </td>
                        <td>
                          <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
                            {ev.score} / 100
                          </span>
                        </td>
                        <td>
                          <span className="chip" style={{
                            background: grade === 'A+' || grade === 'A' ? 'var(--good-soft)' : 'var(--warn-soft)',
                            color: grade === 'A+' || grade === 'A' ? 'var(--good)' : 'var(--warn)',
                            fontFamily: 'var(--f-mono)',
                            fontSize: 14,
                            fontWeight: 700
                          }}>
                            {grade}
                          </span>
                        </td>
                        <td className="mono" style={{ fontWeight: 600 }}>
                          2 Credits
                        </td>
                        <td>
                          {isTransferred ? (
                            <span style={{ fontSize: 13, color: 'var(--good)', fontWeight: 600 }}>
                              ✓ Transferred
                            </span>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handlePushToGradebook(ev)}
                              disabled={pushingId === ev.id}
                            >
                              {pushingId === ev.id ? 'Transferring…' : 'Push to Gradebook →'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
