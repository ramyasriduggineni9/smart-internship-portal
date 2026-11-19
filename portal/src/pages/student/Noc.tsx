import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { STUDENT_NAV } from '../../config/nav';
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

interface NocRequest {
  id: string;
  application_id: string;
  created_at: string;
  application: {
    id: string;
    stage: string;
    internship: {
      title: string;
      employer?: {
        company: string;
      };
    };
  };
  signatures: NocSignature[];
}

export default function StudentNoc() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [selectedApps, setSelectedApps] = useState<any[]>([]);
  const [nocRequests, setNocRequests] = useState<NocRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingAppId, setRequestingAppId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    loadNocData();
  }, [profile?.id]);

  async function loadNocData() {
    setLoading(true);
    try {
      // 1. Fetch Selected applications
      const { data: apps } = await supabase
        .from('applications')
        .select('id, stage, internship:internships(id, title, employer:employers(company))')
        .eq('student_id', profile!.id)
        .eq('stage', 'Selected');
      setSelectedApps(apps || []);

      // 2. Fetch existing NOC requests for this student's applications
      if (apps && apps.length > 0) {
        const appIds = apps.map(a => a.id);
        const { data: nocs } = await supabase
          .from('noc_requests')
          .select('*, application:applications(id, stage, internship:internships(title, employer:employers(company)))')
          .in('application_id', appIds);

        const list = (nocs || []) as unknown as NocRequest[];
        // Fetch signatures for each noc
        for (const item of list) {
          const { data: sigs } = await supabase
            .from('noc_signatures')
            .select('*')
            .eq('noc_id', item.id)
            .order('signed_at', { ascending: true });
          item.signatures = (sigs || []) as NocSignature[];
        }
        setNocRequests(list);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load NOC status', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleRequestNoc = async (appId: string) => {
    setRequestingAppId(appId);
    try {
      const { error } = await supabase.from('noc_requests').insert({
        application_id: appId,
      });
      if (error) throw error;
      toast('NOC request submitted! Routed to your Faculty Mentor for step 1 signature.', 'success');
      loadNocData();
    } catch (err: any) {
      toast(err.message || 'Failed to submit NOC request', 'error');
    } finally {
      setRequestingAppId(null);
    }
  };

  const ROLES_ORDER: ('Mentor' | 'HOD' | 'Placement Officer')[] = ['Mentor', 'HOD', 'Placement Officer'];

  return (
    <AppShell navItems={STUDENT_NAV}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Paperless NOC Approval Chain</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Cryptographic 3-tier sequential e-approval (Mentor → HOD → Placement Officer) for selected internships.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            Loading NOC requests…
          </div>
        ) : selectedApps.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✍️</div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>No Selected Applications Yet</h3>
            <p className="muted" style={{ maxWidth: 480, margin: '0 auto 16px', fontSize: 14 }}>
              The paperless No Objection Certificate (NOC) chain becomes available automatically once an employer marks your application as <strong>Selected</strong>.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {selectedApps.map(app => {
              const existingNoc = nocRequests.find(n => n.application_id === app.id);
              const sigs = existingNoc?.signatures || [];
              const isComplete = sigs.length === 3;

              return (
                <div key={app.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 18 }}>{app.internship?.title}</h3>
                      <div className="muted" style={{ fontSize: 14 }}>
                        Organization: <strong>{app.internship?.employer?.company || 'Verified Employer'}</strong>
                      </div>
                    </div>

                    {!existingNoc ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleRequestNoc(app.id)}
                        disabled={requestingAppId === app.id}
                      >
                        {requestingAppId === app.id ? 'Submitting…' : 'Request Institutional NOC →'}
                      </button>
                    ) : (
                      <span className="chip" style={{
                        background: isComplete ? 'var(--good-soft)' : 'var(--warn-soft)',
                        color: isComplete ? 'var(--good)' : 'var(--warn)'
                      }}>
                        {isComplete ? '✓ Full NOC Approved' : `${sigs.length} of 3 Signatures`}
                      </span>
                    )}
                  </div>

                  {existingNoc && (
                    <div>
                      <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, marginBottom: 12 }}>
                        Sequential Approval Chain
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                        {ROLES_ORDER.map((stepRole, stepIndex) => {
                          const sig = sigs.find(s => s.role === stepRole);
                          const isNext = !sig && (stepIndex === 0 || sigs.some(s => s.role === ROLES_ORDER[stepIndex - 1]));

                          return (
                            <div
                              key={stepRole}
                              style={{
                                border: `1.5px solid ${sig ? 'var(--good)' : isNext ? 'var(--accent)' : 'var(--line)'}`,
                                background: sig ? 'var(--good-soft)' : isNext ? 'var(--surface)' : 'var(--bg)',
                                borderRadius: 'var(--radius)',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                                    STEP 0{stepIndex + 1}
                                  </span>
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: sig ? 'var(--good)' : isNext ? 'var(--accent)' : 'var(--muted)'
                                  }}>
                                    {sig ? '✓ SIGNED' : isNext ? '● PENDING REVIEW' : 'WAITING'}
                                  </span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                                  {stepRole === 'Mentor' ? 'Faculty Mentor' : stepRole === 'HOD' ? 'Head of Dept (HOD)' : 'Placement Officer'}
                                </div>
                              </div>

                              {sig ? (
                                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                  <div style={{
                                    fontFamily: 'var(--f-sign)',
                                    fontSize: 22,
                                    color: 'var(--accent)',
                                    lineHeight: 1
                                  }}>
                                    {sig.signer_name}
                                  </div>
                                  <div className="mono" style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                                    Signed: {new Date(sig.signed_at).toLocaleString()}
                                  </div>
                                  <div className="mono" style={{ fontSize: 9, color: 'var(--muted)', wordBreak: 'break-all' }}>
                                    Hash: {sig.hash.substring(0, 16)}...
                                  </div>
                                </div>
                              ) : (
                                <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
                                  {isNext ? 'Awaiting sign-off in administrator queue' : `Requires previous step approval first`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Complete NOC Certificate Preview */}
                      {isComplete && (
                        <div style={{
                          marginTop: 20,
                          padding: 20,
                          border: '2px solid var(--good)',
                          borderRadius: 'var(--radius)',
                          background: 'var(--surface)'
                        }}>
                          <div style={{ textAlign: 'center', marginBottom: 14 }}>
                            <h3 style={{ fontSize: 18, color: 'var(--ink)' }}>OFFICIAL NO OBJECTION CERTIFICATE</h3>
                            <p className="muted" style={{ fontSize: 12 }}>Digitally Verified & Validated via Smart Internship Portal</p>
                          </div>
                          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                            This certifies that <strong>{String(profile?.full_name || 'Student')}</strong> (Roll No: {String(profile?.roll_number || 'N/A')}, College: {String(profile?.college || 'Registered College')})
                            has received official institutional clearance to undertake the internship opportunity as <strong>{app.internship?.title}</strong> with <strong>{app.internship?.employer?.company}</strong>.
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--line)', paddingTop: 12, textAlign: 'center' }}>
                            {sigs.map(s => (
                              <div key={s.id}>
                                <div style={{ fontFamily: 'var(--f-sign)', fontSize: 24, color: 'var(--accent)' }}>
                                  {s.signer_name}
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{s.role}</div>
                              </div>
                            ))}
                          </div>
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
