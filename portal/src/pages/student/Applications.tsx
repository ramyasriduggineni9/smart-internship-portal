import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { STUDENT_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

const STAGES = ['Applied', 'Under review', 'Interview scheduled', 'Selected', 'Not selected'] as const;

interface AppItem {
  id: string;
  stage: typeof STAGES[number];
  created_at: string;
  internship: {
    id: string;
    title: string;
    stipend: string;
    location: string;
    employer?: {
      company: string;
    };
  };
}

interface Message {
  id: string;
  application_id: string;
  body: string;
  created_at: string;
  sender_id: string;
}

export default function StudentApplications() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [applications, setApplications] = useState<AppItem[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    loadApplications();

    // Supabase Realtime subscription
    const channel = supabase
      .channel('student-apps')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications', filter: `student_id=eq.${profile.id}` },
        () => {
          loadApplications();
          toast('Application stage updated in real-time!', 'info');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  async function loadApplications() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id, stage, created_at, internship:internships(id, title, stipend, location, employer:employers(company))')
        .eq('student_id', profile!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const apps = (data || []) as unknown as AppItem[];
      setApplications(apps);

      // Fetch messages for these applications
      if (apps.length > 0) {
        const appIds = apps.map(a => a.id);
        const { data: msgData } = await supabase
          .from('messages')
          .select('*')
          .in('application_id', appIds)
          .order('created_at', { ascending: true });

        const grouped: Record<string, Message[]> = {};
        for (const m of (msgData || [])) {
          if (!grouped[m.application_id]) grouped[m.application_id] = [];
          grouped[m.application_id].push(m);
        }
        setMessages(grouped);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell navItems={STUDENT_NAV}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Application Kanban Pipeline</h1>
            <p className="muted" style={{ fontSize: 14 }}>
              Track real-time candidate progression and employer communications.
            </p>
          </div>
          <Link to="/student/feed" className="btn btn-primary btn-sm">
            + Apply for More Roles
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            Loading pipeline…
          </div>
        ) : applications.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <p className="muted" style={{ marginBottom: 16 }}>You have not submitted any internship applications yet.</p>
            <Link to="/student/feed" className="btn btn-primary">
              Browse Open Opportunities
            </Link>
          </div>
        ) : (
          <div className="kanban-board">
            {STAGES.map(stage => {
              const stageApps = applications.filter(a => a.stage === stage);
              return (
                <div key={stage} className="kanban-col">
                  <div className="kanban-col-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{stage}</span>
                    <span style={{
                      background: 'var(--line)',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 11,
                      color: 'var(--ink)'
                    }}>
                      {stageApps.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stageApps.map(app => {
                      const appMsgs = messages[app.id] || [];
                      const isSelected = app.stage === 'Selected';

                      return (
                        <div key={app.id} className="kanban-card">
                          <h4 style={{ fontSize: 15, marginBottom: 4 }}>
                            {app.internship?.title || 'Internship Role'}
                          </h4>
                          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 6 }}>
                            {app.internship?.employer?.company || 'Verified Employer'}
                          </div>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                            📍 {app.internship?.location || 'Remote'} • 💰 {app.internship?.stipend || 'Stipend'}
                          </div>

                          {/* Selected CTA */}
                          {isSelected && (
                            <div style={{
                              background: 'var(--good-soft)',
                              color: 'var(--good)',
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 12,
                              fontWeight: 600,
                              marginBottom: 8,
                              textAlign: 'center'
                            }}>
                              🎉 Selected!
                              <div style={{ marginTop: 4 }}>
                                <Link to="/student/noc" style={{ textDecoration: 'underline' }}>
                                  Initiate NOC Approval →
                                </Link>
                              </div>
                            </div>
                          )}

                          {/* Employer message notifications */}
                          {appMsgs.length > 0 && (
                            <div style={{
                              background: 'var(--bg)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '8px',
                              fontSize: 12,
                              borderLeft: '3px solid var(--accent)',
                              marginTop: 6
                            }}>
                              <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                                Latest Update:
                              </div>
                              <div className="muted" style={{ fontStyle: 'italic' }}>
                                "{appMsgs[appMsgs.length - 1].body}"
                              </div>
                            </div>
                          )}

                          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, textAlign: 'right' }}>
                            Applied: {new Date(app.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}

                    {stageApps.length === 0 && (
                      <div style={{
                        padding: 16,
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'var(--muted)',
                        border: '1.5px dashed var(--line)',
                        borderRadius: 'var(--radius)'
                      }}>
                        No candidates
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
