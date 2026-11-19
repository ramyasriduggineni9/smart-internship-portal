import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { EMPLOYER_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

interface InternReadyForEval {
  application_id: string;
  student_id: string;
  student_name: string;
  student_college: string;
  student_roll: string;
  internship_title: string;
  total_hours: number;
}

interface CompletedEval {
  id: string;
  score: number;
  notes: string;
  submitted_at: string;
  student_name: string;
  internship_title: string;
}

export default function EmployerEvaluate() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [readyList, setReadyList] = useState<InternReadyForEval[]>([]);
  const [completedList, setCompletedList] = useState<CompletedEval[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [scoreInput, setScoreInput] = useState<number>(88);
  const [notesInput, setNotesInput] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadEvaluationData();
  }, [profile?.id]);

  async function loadEvaluationData() {
    setLoading(true);
    try {
      // 1. Fetch employer's internships
      const { data: intData } = await supabase
        .from('internships')
        .select('id, title')
        .eq('employer_id', profile!.id);

      const myInts = intData || [];
      if (myInts.length === 0) {
        setLoading(false);
        return;
      }
      const intIds = myInts.map(i => i.id);

      // 2. Fetch selected applications
      const { data: appData } = await supabase
        .from('applications')
        .select('id, student_id, internship_id, student:profiles(full_name, college, roll_number)')
        .in('internship_id', intIds)
        .eq('stage', 'Selected');

      const selectedApps = appData || [];

      // 3. Fetch evaluations already submitted by this employer
      const { data: evalData } = await supabase
        .from('evaluations')
        .select('*, application:applications(student:profiles(full_name), internship:internships(title))')
        .eq('employer_id', profile!.id);

      const completed = (evalData || []).map(e => ({
        id: e.id,
        score: e.score,
        notes: e.notes,
        submitted_at: e.submitted_at,
        student_name: e.application?.student?.full_name || 'Student',
        internship_title: e.application?.internship?.title || 'Internship',
      }));
      setCompletedList(completed);

      const evaluatedAppIds = (evalData || []).map(e => e.application_id);

      // 4. Calculate logged hours for each selected application
      const ready: InternReadyForEval[] = [];
      for (const app of selectedApps) {
        if (evaluatedAppIds.includes(app.id)) continue;

        const { data: hoursData } = await supabase
          .from('hours_log')
          .select('hours')
          .eq('application_id', app.id);

        const totalHours = (hoursData || []).reduce((acc, h) => acc + (h.hours || 0), 0);
        if (totalHours >= 120) {
          const intObj = myInts.find(i => i.id === app.internship_id);
          ready.push({
            application_id: app.id,
            student_id: app.student_id,
            student_name: (app.student as any)?.full_name || 'Student',
            student_college: (app.student as any)?.college || 'College',
            student_roll: (app.student as any)?.roll_number || 'N/A',
            internship_title: intObj?.title || 'Internship',
            total_hours: totalHours,
          });
        }
      }

      setReadyList(ready);
      if (ready.length > 0) {
        setSelectedAppId(ready[0].application_id);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load evaluation data', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) {
      toast('Please select an intern to evaluate', 'error');
      return;
    }
    if (scoreInput < 0 || scoreInput > 100) {
      toast('Evaluation score must be between 0 and 100', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('evaluations').insert({
        application_id: selectedAppId,
        employer_id: profile!.id,
        score: Number(scoreInput),
        notes: notesInput.trim(),
      });

      if (error) throw error;

      toast('Evaluation recorded! College administrator notified for credit transfer.', 'success');
      setNotesInput('');
      loadEvaluationData();
    } catch (err: any) {
      toast(err.message || 'Failed to submit evaluation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell navItems={EMPLOYER_NAV}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Intern Performance Evaluation</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Evaluate interns who have completed their required 120 verified work hours.
        </p>

        {/* Evaluation Form */}
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 className="section-title">Submit Performance Score (0 - 100)</h3>

          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>Loading records…</div>
          ) : readyList.length === 0 ? (
            <div style={{ padding: '16px 0' }}>
              <p className="muted" style={{ fontSize: 14 }}>
                No interns are currently awaiting evaluation. Interns must be marked <strong>Selected</strong> and log at least <strong>120 verified hours</strong> to appear here.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitEvaluation}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                <div className="form-group">
                  <label>Select Eligible Intern *</label>
                  <select
                    value={selectedAppId}
                    onChange={e => setSelectedAppId(e.target.value)}
                    required
                  >
                    {readyList.map(item => (
                      <option key={item.application_id} value={item.application_id}>
                        {item.student_name} ({item.student_college}) — {item.internship_title} [{item.total_hours} hrs]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Performance Score (0 - 100 pts) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scoreInput}
                    onChange={e => setScoreInput(Number(e.target.value))}
                    required
                  />
                  <span className="muted" style={{ fontSize: 11 }}>
                    ≥85 = Grade A+ | ≥70 = Grade A | ≥60 = Grade B | &lt;60 = Grade C
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Supervisor Feedback & Technical Evaluation Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Demonstrated exceptional technical proficiency in developing fullstack modules. Delivered all sprint deliverables on time..."
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Final Evaluation'}
              </button>
            </form>
          )}
        </div>

        {/* Completed Evaluations */}
        <div className="card">
          <h3 className="section-title">Submitted Intern Evaluations</h3>
          {completedList.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, padding: '12px 0' }}>
              No evaluations submitted yet.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Intern Name</th>
                    <th>Role</th>
                    <th>Score</th>
                    <th>Evaluation Notes</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {completedList.map(ev => (
                    <tr key={ev.id}>
                      <td style={{ fontWeight: 600 }}>{ev.student_name}</td>
                      <td>{ev.internship_title}</td>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {ev.score} / 100
                      </td>
                      <td className="muted" style={{ fontSize: 13 }}>{ev.notes || '—'}</td>
                      <td className="mono" style={{ fontSize: 12 }}>{new Date(ev.submitted_at).toLocaleDateString()}</td>
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
