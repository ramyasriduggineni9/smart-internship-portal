import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { EMPLOYER_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { matchScore } from '../../lib/skillGraph';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

const STAGES = ['Applied', 'Under review', 'Interview scheduled', 'Selected', 'Not selected'] as const;

interface ApplicantCard {
  id: string;
  stage: typeof STAGES[number];
  created_at: string;
  student_id: string;
  internship: {
    id: string;
    title: string;
    required_skills: string[];
  };
  student: {
    id: string;
    full_name: string;
    email: string;
    college: string;
    roll_number: string;
    cgpa: number;
    department: string;
    github: string;
    linkedin: string;
  };
  skills: string[];
  score: number;
}

export default function EmployerApplicants() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [applicants, setApplicants] = useState<ApplicantCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Message modal state
  const [activeApp, setActiveApp] = useState<ApplicantCard | null>(null);
  const [msgBody, setMsgBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadApplicants();
  }, [profile?.id]);

  async function loadApplicants() {
    setLoading(true);
    try {
      // 1. Fetch employer's internships
      const { data: intData } = await supabase
        .from('internships')
        .select('id, title, required_skills')
        .eq('employer_id', profile!.id);

      const internshipsList = intData || [];
      if (internshipsList.length === 0) {
        setApplicants([]);
        setLoading(false);
        return;
      }

      const intIds = internshipsList.map(i => i.id);

      // 2. Fetch applications
      const { data: appData, error } = await supabase
        .from('applications')
        .select('*, student:profiles(id, full_name, email, college, roll_number, cgpa, department, github, linkedin)')
        .in('internship_id', intIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 3. For each applicant, fetch their skills to compute match score
      const cards: ApplicantCard[] = [];
      for (const app of (appData || [])) {
        const intObj = internshipsList.find(i => i.id === app.internship_id);
        const { data: stSkills } = await supabase
          .from('student_skills')
          .select('skill_name')
          .eq('student_id', app.student_id);

        const skillNames = (stSkills || []).map(s => s.skill_name);
        const score = Math.round(matchScore(skillNames, intObj?.required_skills || []).score * 100);

        cards.push({
          id: app.id,
          stage: app.stage,
          created_at: app.created_at,
          student_id: app.student_id,
          internship: intObj!,
          student: app.student as any,
          skills: skillNames,
          score,
        });
      }

      setApplicants(cards);
    } catch (err: any) {
      toast(err.message || 'Failed to load applicants', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStage = async (appId: string, newStage: typeof STAGES[number]) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          stage: newStage,
        })
        .eq('id', appId);

      if (error) throw error;

      // Send automated stage notification message to student
      await supabase.from('messages').insert({
        application_id: appId,
        sender_id: profile!.id,
        body: `Application status updated to: ${newStage}`,
      });

      toast(`Candidate moved to ${newStage}`, 'success');
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, stage: newStage } : a));
    } catch (err: any) {
      toast(err.message || 'Failed to update stage', 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!msgBody.trim() || !activeApp) return;
    setSendingMsg(true);
    try {
      const { error } = await supabase.from('messages').insert({
        application_id: activeApp.id,
        sender_id: profile!.id,
        body: msgBody.trim(),
      });

      if (error) throw error;

      toast('Message dispatched to student applicant!', 'success');
      setMsgBody('');
      setActiveApp(null);
    } catch (err: any) {
      toast(err.message || 'Failed to send message', 'error');
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <AppShell navItems={EMPLOYER_NAV}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Applicant Tracking & Screening</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
          Screen candidates with skill-graph match scores and advance hiring stages.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            Loading applicants…
          </div>
        ) : applicants.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <p className="muted">No candidate applications received yet for your open internships.</p>
          </div>
        ) : (
          <div className="kanban-board">
            {STAGES.map(stage => {
              const stageList = applicants.filter(a => a.stage === stage);

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
                      {stageList.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stageList.map(item => (
                      <div key={item.id} className="kanban-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div>
                            <h4 style={{ fontSize: 15 }}>{item.student?.full_name || 'Candidate'}</h4>
                            <div className="muted" style={{ fontSize: 12 }}>
                              {item.student?.college || 'College'} • CGPA: {item.student?.cgpa || 'N/A'}
                            </div>
                          </div>
                          <span className="mono" style={{
                            fontSize: 13,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            background: item.score >= 70 ? 'var(--good-soft)' : 'var(--accent-soft)',
                            color: item.score >= 70 ? 'var(--good)' : 'var(--accent)'
                          }}>
                            {item.score}%
                          </span>
                        </div>

                        <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                          Applied for: <strong>{item.internship?.title}</strong>
                        </div>

                        {/* Candidate Skills */}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                          {item.skills.slice(0, 4).map(s => (
                            <span key={s} className="chip chip-neutral" style={{ fontSize: 10, padding: '2px 6px' }}>
                              {s}
                            </span>
                          ))}
                          {item.skills.length > 4 && (
                            <span className="muted" style={{ fontSize: 10 }}>+{item.skills.length - 4}</span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                          <select
                            value={item.stage}
                            onChange={e => handleUpdateStage(item.id, e.target.value as any)}
                            style={{ fontSize: 12, padding: '4px 8px', flex: 1 }}
                          >
                            {STAGES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>

                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: 12 }}
                            onClick={() => { setActiveApp(item); setMsgBody(''); }}
                            title="Message student"
                          >
                            💬
                          </button>
                        </div>
                      </div>
                    ))}

                    {stageList.length === 0 && (
                      <div style={{
                        padding: 14,
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'var(--muted)',
                        border: '1.5px dashed var(--line)',
                        borderRadius: 'var(--radius)'
                      }}>
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Message Modal */}
        <Modal
          open={Boolean(activeApp)}
          onClose={() => setActiveApp(null)}
          title={`Message: ${activeApp?.student?.full_name || 'Student'}`}
        >
          {activeApp && (
            <div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
                Send an interview invitation, update, or feedback regarding their application for <strong>{activeApp.internship?.title}</strong>.
              </p>

              <div className="form-group">
                <label>Message Content *</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Congratulations! We would like to schedule an interview with you on Thursday at 3 PM..."
                  value={msgBody}
                  onChange={e => setMsgBody(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleSendMessage}
                  disabled={sendingMsg || !msgBody.trim()}
                >
                  {sendingMsg ? 'Dispatching…' : 'Send Message'}
                </button>
                <button className="btn btn-ghost" onClick={() => setActiveApp(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
