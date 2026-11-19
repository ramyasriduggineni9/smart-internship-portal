import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { STUDENT_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { matchScore } from '../../lib/skillGraph';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function StudentAssistant() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello ${profile?.full_name || 'Student'}! I am your Smart Internship AI Advisor. Ask me anything about your matched internships, eligibility, NOC approval chain, logged hours, or resume tips.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [internships, setInternships] = useState<any[]>([]);
  const [studentSkills, setStudentSkills] = useState<string[]>([]);
  const [studentCourses, setStudentCourses] = useState<string[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  async function loadData() {
    // 1. Student skills
    const { data: skRows } = await supabase.from('student_skills').select('skill_name').eq('student_id', profile!.id);
    setStudentSkills((skRows || []).map(r => r.skill_name));

    // 2. Student courses
    const { data: cRows } = await supabase.from('student_courses').select('course_name').eq('student_id', profile!.id);
    setStudentCourses((cRows || []).map(r => r.course_name));

    // 3. Internships
    const { data: intRows } = await supabase.from('internships').select('*, employer:employers(company)').eq('status', 'open');
    setInternships(intRows || []);

    // 4. Applications
    const { data: appRows } = await supabase.from('applications').select('*, internship:internships(title)').eq('student_id', profile!.id);
    setApplications(appRows || []);
  }

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    // Rule-based engine
    setTimeout(() => {
      const reply = processQuery(query.toLowerCase());
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    }, 300);
  };

  function processQuery(q: string): string {
    // 1. Best match
    if (q.includes('best match') || q.includes('top match') || q.includes('recommended') || q.includes('find internship')) {
      if (internships.length === 0) return 'There are currently no open internships listed on the portal.';
      const scored = internships.map(i => ({
        title: i.title,
        company: i.employer?.company || 'Verified Employer',
        score: Math.round(matchScore(studentSkills, i.required_skills || []).score * 100)
      }));
      scored.sort((a, b) => b.score - a.score);
      const top3 = scored.slice(0, 3);
      return `Here are your top matched opportunities based on your skills (${studentSkills.join(', ') || 'No skills added'}):\n\n` +
        top3.map((j, idx) => `${idx + 1}. ${j.title} at ${j.company} — ${j.score}% Skill Graph Match`).join('\n') +
        '\n\nVisit the Internships feed to apply directly!';
    }

    // 2. Eligibility
    if (q.includes('eligib') || q.includes('cgpa') || q.includes('qualif')) {
      const userCgpa = Number(profile?.cgpa || 0);
      let eligible = 0;
      for (const i of internships) {
        const passesCgpa = !i.min_cgpa || userCgpa >= Number(i.min_cgpa);
        const passesPrereqs = !i.prerequisite_courses || i.prerequisite_courses.every((pc: string) => studentCourses.includes(pc));
        if (passesCgpa && passesPrereqs) eligible++;
      }
      return `Eligibility Report:\n• Your CGPA: ${userCgpa}\n• Verified Courses: ${studentCourses.length > 0 ? studentCourses.join(', ') : 'None'}\n\nYou currently qualify for ${eligible} out of ${internships.length} active roles. Complete prerequisite coursework in your Profile to expand eligibility!`;
    }

    // 3. Application status
    if (q.includes('application') || q.includes('status') || q.includes('kanban')) {
      if (applications.length === 0) {
        return 'You have not submitted any applications yet. Browse the Internships feed to submit your first application.';
      }
      return `Current Applications (${applications.length}):\n` +
        applications.map(a => `• ${a.internship?.title || 'Role'}: ${a.stage}`).join('\n');
    }

    // 4. NOC status
    if (q.includes('noc') || q.includes('approval') || q.includes('letter')) {
      const selected = applications.filter(a => a.stage === 'Selected');
      if (selected.length === 0) {
        return 'NOC (No Objection Certificate) workflows unlock once an employer marks your application as "Selected". Keep an eye on your Applications tab!';
      }
      return `You have ${selected.length} Selected application(s) eligible for NOC approval. Remember that the NOC chain requires 3 sequential signatures: 1. Faculty Mentor → 2. Head of Department (HOD) → 3. Placement Officer.`;
    }

    // 5. Skill gaps
    if (q.includes('skill gap') || q.includes('missing skill') || q.includes('learn')) {
      const allReqs = new Set<string>();
      internships.forEach(i => (i.required_skills || []).forEach((s: string) => allReqs.add(s)));
      const gaps = Array.from(allReqs).filter(s => !studentSkills.includes(s));
      return `Top In-Demand Skills You Haven't Added Yet:\n${gaps.slice(0, 5).map(s => `• ${s}`).join('\n')}\n\nYou can take micro-quizzes in the Learning tab to add these skills to your profile instantly!`;
    }

    // 6. Resume tips
    if (q.includes('resume') || q.includes('ats') || q.includes('cv')) {
      return `ATS Optimization Tips:\n1. Quantify achievements (e.g. "reduced latency by 35%").\n2. Include both high-level frameworks and fundamental tools (e.g. React AND JavaScript).\n3. Keep your resume plain-text friendly with standard section headers: Education, Experience, Projects, Skills.\n4. Use our Resume ATS Analyzer to evaluate your score against target roles!`;
    }

    // Default fallback
    return `I can help you with:\n1. "What are my best matches?"\n2. "Am I eligible for open internships?"\n3. "What is my application status?"\n4. "How does the NOC chain work?"\n5. "What skill gaps should I close?"\n6. "Give me resume ATS tips"`;
  }

  const QUICK_PROMPTS = [
    'What are my best matches?',
    'Am I eligible for open roles?',
    'Show my application status',
    'What skill gaps should I close?',
    'How does the NOC chain work?',
    'Give me resume ATS tips'
  ];

  return (
    <AppShell navItems={STUDENT_NAV}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        <div style={{ marginBottom: 12 }}>
          <h1 className="page-title" style={{ marginBottom: 4 }}>AI Internship Advisor</h1>
          <p className="muted" style={{ fontSize: 14 }}>
            Ask questions about skill matching, eligibility rules, NOC status, and career readiness.
          </p>
        </div>

        {/* Quick prompt chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              className="chip chip-neutral"
              style={{ cursor: 'pointer', border: '1px solid var(--line)', padding: '5px 12px' }}
              onClick={() => handleSend(prompt)}
            >
              💬 {prompt}
            </button>
          ))}
        </div>

        {/* Messages container */}
        <div className="card" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          marginBottom: 12
        }}>
          {messages.map(m => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: 'var(--radius)',
                background: m.sender === 'user' ? 'var(--accent)' : 'var(--bg)',
                color: m.sender === 'user' ? 'var(--accent-fg)' : 'var(--ink)',
                border: m.sender === 'user' ? 'none' : '1px solid var(--line)',
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}>
                {m.text}
              </div>
              <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                {m.timestamp}
              </span>
            </div>
          ))}
        </div>

        {/* Input form */}
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Type your question (e.g. 'What are my best matches?')..."
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          />
          <button className="btn btn-primary" onClick={() => handleSend()}>
            Send
          </button>
        </div>
      </div>
    </AppShell>
  );
}
