import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { ADMIN_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

interface NocSignature {
  id: string;
  role: 'Mentor' | 'HOD' | 'Placement Officer';
  signer_name: string;
  signed_at: string;
  hash: string;
}

interface NocQueueItem {
  id: string;
  application_id: string;
  created_at: string;
  application: {
    id: string;
    student: {
      id: string;
      full_name: string;
      college: string;
      roll_number: string;
      department: string;
    };
    internship: {
      title: string;
      employer?: {
        company: string;
      };
    };
  };
  signatures: NocSignature[];
}

const ROLES_ORDER: ('Mentor' | 'HOD' | 'Placement Officer')[] = ['Mentor', 'HOD', 'Placement Officer'];

// Simple cryptographic SHA-256 in browser using Web Crypto API
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function AdminApprovals() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [queue, setQueue] = useState<NocQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Signing state
  const defaultRole = (profile?.faculty_title as any) || 'Mentor';
  const [signingRole, setSigningRole] = useState<'Mentor' | 'HOD' | 'Placement Officer'>(defaultRole);
  const [signerName, setSignerName] = useState(profile?.full_name || '');
  const [activeNocId, setActiveNocId] = useState<string | null>(null);
  const [submittingSig, setSubmittingSig] = useState(false);

  useEffect(() => {
    loadNocQueue();
  }, []);

  async function loadNocQueue() {
    setLoading(true);
    try {
      const { data: nocRows, error } = await supabase
        .from('noc_requests')
        .select('*, application:applications(id, student:profiles(id, full_name, college, roll_number, department), internship:internships(title, employer:employers(company)))')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const list = (nocRows || []) as unknown as NocQueueItem[];
      // Load signatures for all
      for (const item of list) {
        const { data: sigs } = await supabase
          .from('noc_signatures')
          .select('*')
          .eq('noc_id', item.id)
          .order('signed_at', { ascending: true });
        item.signatures = (sigs || []) as NocSignature[];
      }
      setQueue(list);
    } catch (err: any) {
      toast(err.message || 'Failed to load NOC queue', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSign = async (nocId: string) => {
    if (!signerName.trim()) {
      toast('Please type your full legal name to execute the digital signature', 'error');
      return;
    }

    const item = queue.find(q => q.id === nocId);
    if (!item) return;

    // Check sequential validity
    const roleIdx = ROLES_ORDER.indexOf(signingRole);
    if (roleIdx > 0) {
      const priorRole = ROLES_ORDER[roleIdx - 1];
      const hasPrior = item.signatures.some(s => s.role === priorRole);
      if (!hasPrior) {
        toast(`Sequential order error: ${priorRole} must sign before ${signingRole}`, 'error');
        return;
      }
    }

    if (item.signatures.some(s => s.role === signingRole)) {
      toast(`This NOC has already been signed by ${signingRole}`, 'error');
      return;
    }

    setSubmittingSig(true);
    try {
      const timestamp = new Date().toISOString();
      const hashInput = `${nocId}:${signingRole}:${signerName.trim()}:${timestamp}`;
      const signatureHash = await sha256(hashInput);

      const { error } = await supabase.from('noc_signatures').insert({
        noc_id: nocId,
        role: signingRole,
        signer_name: signerName.trim(),
        signed_at: timestamp,
        hash: signatureHash,
      });

      if (error) throw error;

      toast(`Successfully executed ${signingRole} e-signature!`, 'success');
      setActiveNocId(null);
      loadNocQueue();
    } catch (err: any) {
      toast(err.message || 'Failed to record signature', 'error');
    } finally {
      setSubmittingSig(false);
    }
  };

  return (
    <AppShell navItems={ADMIN_NAV}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Institutional NOC Approval Queue</h1>
            <p className="muted" style={{ fontSize: 14 }}>
              Execute sequential 3-tier digital signatures with cryptographic integrity.
            </p>
          </div>

          {/* Role selector for admin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Active Signing Capacity:</span>
            <select
              value={signingRole}
              onChange={e => setSigningRole(e.target.value as any)}
              style={{ width: 'auto', padding: '4px 8px', fontSize: 13 }}
            >
              <option value="Mentor">Faculty Mentor</option>
              <option value="HOD">Head of Department (HOD)</option>
              <option value="Placement Officer">Placement Officer</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            Loading approval queue…
          </div>
        ) : queue.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <p className="muted">No NOC requests currently in queue.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {queue.map(item => {
              const sigs = item.signatures || [];
              const isComplete = sigs.length === 3;
              const alreadySignedByActiveRole = sigs.some(s => s.role === signingRole);

              // Check if it's currently this role's turn
              const roleIdx = ROLES_ORDER.indexOf(signingRole);
              const isEligibleToSign = !alreadySignedByActiveRole && (roleIdx === 0 || sigs.some(s => s.role === ROLES_ORDER[roleIdx - 1]));

              return (
                <div key={item.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ fontSize: 18 }}>{item.application?.student?.full_name || 'Student Candidate'}</h3>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                          Roll: {item.application?.student?.roll_number || 'N/A'}
                        </span>
                      </div>
                      <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                        {item.application?.student?.college || 'College'} • Dept: {item.application?.student?.department || 'General'}
                      </div>
                      <div style={{ fontSize: 14, marginTop: 6, fontWeight: 500 }}>
                        Selected as: <strong>{item.application?.internship?.title}</strong> @ {item.application?.internship?.employer?.company || 'Employer'}
                      </div>
                    </div>

                    <span className="chip" style={{
                      background: isComplete ? 'var(--good-soft)' : 'var(--warn-soft)',
                      color: isComplete ? 'var(--good)' : 'var(--warn)',
                      fontWeight: 700
                    }}>
                      {isComplete ? '✓ Full NOC Approved' : `${sigs.length} of 3 Signatures`}
                    </span>
                  </div>

                  {/* Sequential Chain Status Display */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
                    {ROLES_ORDER.map((r, idx) => {
                      const sig = sigs.find(s => s.role === r);
                      const isNext = !sig && (idx === 0 || sigs.some(s => s.role === ROLES_ORDER[idx - 1]));

                      return (
                        <div key={r} style={{
                          padding: 12,
                          borderRadius: 'var(--radius-sm)',
                          border: `1.5px solid ${sig ? 'var(--good)' : isNext ? 'var(--accent)' : 'var(--line)'}`,
                          background: sig ? 'var(--good-soft)' : isNext ? 'var(--surface)' : 'var(--bg)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 4 }}>
                            <span>STEP 0{idx + 1}</span>
                            <span style={{ color: sig ? 'var(--good)' : isNext ? 'var(--accent)' : 'var(--muted)' }}>
                              {sig ? '✓ SIGNED' : isNext ? '● PENDING' : 'WAITING'}
                            </span>
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{r}</div>
                          {sig && (
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontFamily: 'var(--f-sign)', fontSize: 20, color: 'var(--accent)', lineHeight: 1 }}>
                                {sig.signer_name}
                              </div>
                              <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                                {new Date(sig.signed_at).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* E-Signature Input Box */}
                  {!isComplete && (
                    <div style={{
                      borderTop: '1px solid var(--line)',
                      paddingTop: 14,
                      background: isEligibleToSign ? 'var(--surface)' : 'var(--bg)',
                      padding: 14,
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      {alreadySignedByActiveRole ? (
                        <div style={{ fontSize: 13, color: 'var(--good)', fontWeight: 600 }}>
                          ✓ Your signature ({signingRole}) is recorded for this request.
                        </div>
                      ) : !isEligibleToSign ? (
                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                          ⏳ Waiting for prior signatory in sequence before {signingRole} can execute.
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--ink)' }}>
                            Sign as: <span style={{ color: 'var(--accent)' }}>{signingRole}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: 240 }}>
                              <input
                                type="text"
                                placeholder="Type your full legal name..."
                                value={signerName}
                                onChange={e => setSignerName(e.target.value)}
                              />
                            </div>
                            <button
                              className="btn btn-primary"
                              onClick={() => handleSign(item.id)}
                              disabled={submittingSig || !signerName.trim()}
                            >
                              {submittingSig ? 'Hashing & Signing…' : `Execute ${signingRole} Signature ✍️`}
                            </button>
                          </div>
                          {signerName.trim() && (
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span className="muted" style={{ fontSize: 12 }}>Signature Preview:</span>
                              <span style={{ fontFamily: 'var(--f-sign)', fontSize: 26, color: 'var(--accent)' }}>
                                {signerName}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
