import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { ADMIN_NAV } from '../../config/nav';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

interface EmployerRecord {
  id: string;
  company: string;
  cin: string;
  gstin: string;
  website: string;
  hr_email: string;
  status: 'pending' | 'verified' | 'blocked';
  notes: string;
}

export default function AdminEmployers() {
  const { toast } = useToast();
  const [employers, setEmployers] = useState<EmployerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadEmployers();
  }, []);

  async function loadEmployers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employers')
        .select('*');

      if (error) throw error;
      setEmployers((data || []) as EmployerRecord[]);
    } catch (err: any) {
      toast(err.message || 'Failed to load employers', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (employerId: string, newStatus: 'pending' | 'verified' | 'blocked') => {
    setUpdatingId(employerId);
    try {
      // 1. Update employers table
      const { error: empErr } = await supabase
        .from('employers')
        .update({ status: newStatus })
        .eq('id', employerId);
      if (empErr) throw empErr;

      // 2. Sync to profiles.employer_status
      await supabase
        .from('profiles')
        .update({ employer_status: newStatus })
        .eq('id', employerId);

      toast(`Employer status updated to: ${newStatus}`, 'success');
      setEmployers(prev => prev.map(e => e.id === employerId ? { ...e, status: newStatus } : e));
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppShell navItems={ADMIN_NAV}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Employer Vetting & Compliance</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Review government registration documents (CIN & GSTIN) and manage employer hiring clearance.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            Loading employer records…
          </div>
        ) : employers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <p className="muted">No employer accounts currently registered.</p>
          </div>
        ) : (
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>CIN (ROC ID)</th>
                    <th>GSTIN</th>
                    <th>Contact & Web</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employers.map(emp => {
                    const isPending = emp.status === 'pending';
                    const isVerified = emp.status === 'verified';
                    const isBlocked = emp.status === 'blocked';

                    return (
                      <tr key={emp.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{emp.company || 'Unnamed Company'}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{emp.hr_email || '—'}</div>
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>{emp.cin || 'Not provided'}</td>
                        <td className="mono" style={{ fontSize: 12 }}>{emp.gstin || 'Not provided'}</td>
                        <td>
                          {emp.website ? (
                            <a href={emp.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>
                              Website ↗
                            </a>
                          ) : (
                            <span className="muted" style={{ fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td>
                          <span className="chip" style={{
                            background: isVerified ? 'var(--good-soft)' : isBlocked ? 'var(--bad-soft)' : 'var(--warn-soft)',
                            color: isVerified ? 'var(--good)' : isBlocked ? 'var(--bad)' : 'var(--warn)',
                            textTransform: 'capitalize',
                            fontWeight: 700
                          }}>
                            {emp.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {!isVerified && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleUpdateStatus(emp.id, 'verified')}
                                disabled={updatingId === emp.id}
                              >
                                ✓ Verify
                              </button>
                            )}
                            {!isBlocked && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }}
                                onClick={() => handleUpdateStatus(emp.id, 'blocked')}
                                disabled={updatingId === emp.id}
                              >
                                Block
                              </button>
                            )}
                            {isBlocked && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleUpdateStatus(emp.id, 'pending')}
                                disabled={updatingId === emp.id}
                              >
                                Reset
                              </button>
                            )}
                          </div>
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
