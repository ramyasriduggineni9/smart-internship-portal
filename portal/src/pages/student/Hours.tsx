import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { STUDENT_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

interface LogEntry {
  id: string;
  application_id: string;
  hours: number;
  logged_at: string;
  notes: string;
  application?: {
    internship?: {
      title: string;
    };
  };
}

export default function StudentHours() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [activeApps, setActiveApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [hoursInput, setHoursInput] = useState<number>(8);
  const [dateInput, setDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notesInput, setNotesInput] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadHoursData();
  }, [profile?.id]);

  async function loadHoursData() {
    setLoading(true);
    try {
      // 1. Fetch active applications (Selected or Under review)
      const { data: apps } = await supabase
        .from('applications')
        .select('id, stage, internship:internships(id, title)')
        .eq('student_id', profile!.id);

      const list = apps || [];
      setActiveApps(list);
      if (list.length > 0 && !selectedAppId) {
        setSelectedAppId(list[0].id);
      }

      // 2. Fetch logged hours
      const { data: hourRows, error } = await supabase
        .from('hours_log')
        .select('*, application:applications(internship:internships(title))')
        .eq('student_id', profile!.id)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      setLogs((hourRows || []) as unknown as LogEntry[]);
    } catch (err: any) {
      toast(err.message || 'Failed to load hours', 'error');
    } finally {
      setLoading(false);
    }
  }

  const totalHours = logs.reduce((sum, item) => sum + (item.hours || 0), 0);
  const progressPct = Math.min(Math.round((totalHours / 120) * 100), 100);

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) {
      toast('Please select an active internship application', 'error');
      return;
    }
    if (hoursInput <= 0) {
      toast('Hours must be greater than zero', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('hours_log').insert({
        application_id: selectedAppId,
        student_id: profile!.id,
        hours: Number(hoursInput),
        logged_at: dateInput,
        notes: notesInput,
      });

      if (error) throw error;

      toast(`Logged ${hoursInput} hours successfully!`, 'success');
      setNotesInput('');
      loadHoursData();
    } catch (err: any) {
      toast(err.message || 'Failed to log hours', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell navItems={STUDENT_NAV}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Internship Hours Tracker</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Log and maintain verified work hours. 120 hours unlocks employer evaluation for college credits.
        </p>

        {/* Milestone Card */}
        <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Target Milestone Progress
              </span>
              <div style={{ fontSize: 24, fontWeight: 700, color: totalHours >= 120 ? 'var(--good)' : 'var(--ink)' }}>
                {totalHours} <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 400 }}>/ 120 Hours</span>
              </div>
            </div>
            <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
              {progressPct}%
            </div>
          </div>

          <div className="score-bar" style={{ height: 10, borderRadius: 5 }}>
            <div
              className="score-bar-fill"
              style={{
                width: `${progressPct}%`,
                background: totalHours >= 120 ? 'var(--good)' : 'var(--accent)'
              }}
            />
          </div>

          {totalHours >= 120 ? (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--good-soft)',
              color: 'var(--good)',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span>🎉</span>
              <span>120 Hours Completed! Your employer evaluation is now unlocked in the employer portal.</span>
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
              {120 - totalHours} hours remaining until evaluation unlock.
            </div>
          )}
        </div>

        {/* Log Hours Form */}
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 className="section-title">Log Work Hours</h3>

          {activeApps.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              You do not have any applications yet to log hours against.
            </p>
          ) : (
            <form onSubmit={handleLogHours}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div className="form-group">
                  <label>Internship Assignment *</label>
                  <select
                    value={selectedAppId}
                    onChange={e => setSelectedAppId(e.target.value)}
                    required
                  >
                    {activeApps.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.internship?.title || 'Internship'} ({a.stage})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date Worked *</label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={e => setDateInput(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Hours Worked *</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={hoursInput}
                    onChange={e => setHoursInput(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Work Summary / Tasks Completed</label>
                <input
                  type="text"
                  placeholder="e.g. Developed REST API endpoints for authentication; fixed DB migration bugs"
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Recording…' : '+ Record Hours'}
              </button>
            </form>
          )}
        </div>

        {/* Hours Log History Table */}
        <div className="card">
          <h3 className="section-title">Verified Log History</h3>
          {logs.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, padding: '16px 0' }}>
              No hours logged yet. Submit your first log entry above.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Role</th>
                    <th>Hours</th>
                    <th>Tasks / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="mono" style={{ fontSize: 13 }}>{log.logged_at}</td>
                      <td>{log.application?.internship?.title || 'Internship'}</td>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {log.hours} hrs
                      </td>
                      <td className="muted" style={{ fontSize: 13 }}>{log.notes || '—'}</td>
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
