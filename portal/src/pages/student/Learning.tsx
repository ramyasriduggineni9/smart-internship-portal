import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { STUDENT_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

interface Course {
  id: number;
  title: string;
  skill_name: string;
  description: string;
  duration_hours: number;
}

// Sample MCQ questions for skills in the graph
const SKILL_QUIZZES: Record<string, { q: string; options: string[]; answer: number }[]> = {
  'Docker': [
    { q: 'What is the primary instruction used to specify a base image in a Dockerfile?', options: ['START', 'FROM', 'BASE', 'IMAGE'], answer: 1 },
    { q: 'Which command runs a container in detached mode?', options: ['docker run -d', 'docker start -b', 'docker exec -d', 'docker launch'], answer: 0 },
    { q: 'What is the purpose of Docker Compose?', options: ['Compile Docker source code', 'Define & run multi-container Docker applications', 'Manage cloud billing', 'Create Linux kernels'], answer: 1 }
  ],
  'Python': [
    { q: 'Which data structure is immutable in Python?', options: ['List', 'Dictionary', 'Tuple', 'Set'], answer: 2 },
    { q: 'How do you create a generator in Python?', options: ['Using the yield keyword', 'Using the return keyword', 'Using lambda', 'Using async/await'], answer: 0 },
    { q: 'What is the output of bool([]) in Python?', options: ['True', 'False', 'None', 'Error'], answer: 1 }
  ],
  'React': [
    { q: 'Which hook is used for performing side effects in functional components?', options: ['useState', 'useReducer', 'useEffect', 'useMemo'], answer: 2 },
    { q: 'What is the virtual DOM in React?', options: ['Direct browser DOM clone', 'Lightweight in-memory representation of real DOM', 'HTML string template', 'Shadow DOM'], answer: 1 },
    { q: 'How do you pass data from parent to child components?', options: ['Using Props', 'Using State', 'Using HTML dataset', 'Using Redux only'], answer: 0 }
  ],
  'PostgreSQL': [
    { q: 'Which SQL clause is used to filter aggregated group rows?', options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], answer: 1 },
    { q: 'Which index type is default in PostgreSQL?', options: ['Hash', 'B-Tree', 'GiST', 'GIN'], answer: 1 },
    { q: 'What does ACID stand for in databases?', options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Index, Data', 'Async, Concurrent, Isolated, Direct', 'Audit, Compute, Integrate, Deploy'], answer: 0 }
  ],
};

const DEFAULT_QUIZ = [
  { q: 'What is the primary benefit of modular code architecture?', options: ['Higher maintainability and reusability', 'Larger binary size', 'Automatic encryption', 'Faster network speed'], answer: 0 },
  { q: 'In software testing, what does a unit test verify?', options: ['The entire user journey', 'Individual functions or components in isolation', 'Database latency under load', 'CSS layout across devices'], answer: 1 },
  { q: 'Which version control concept allows parallel feature development?', options: ['Tags', 'Commits', 'Branches', 'Stashes'], answer: 2 }
];

export default function StudentLearning() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [studentSkills, setStudentSkills] = useState<string[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([-1, -1, -1]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  async function loadData() {
    // 1. Fetch courses
    const { data: cData } = await supabase.from('learning_courses').select('*');
    setCourses(cData || []);

    // 2. Fetch student skills
    const { data: skRows } = await supabase
      .from('student_skills')
      .select('skill_name')
      .eq('student_id', profile!.id);
    setStudentSkills((skRows || []).map(r => r.skill_name));
  }

  const handleStartQuiz = (course: Course) => {
    setActiveCourse(course);
    setQuizAnswers([-1, -1, -1]);
    setQuizScore(null);
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    const updated = [...quizAnswers];
    updated[qIdx] = optIdx;
    setQuizAnswers(updated);
  };

  const handleSubmitQuiz = async () => {
    if (quizAnswers.some(a => a === -1)) {
      toast('Please answer all 3 questions before submitting', 'error');
      return;
    }

    const questions = SKILL_QUIZZES[activeCourse!.skill_name] || DEFAULT_QUIZ;
    let score = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.answer) score++;
    });

    setQuizScore(score);
    if (score >= 2) {
      setSubmitting(true);
      try {
        // Add skill to student_skills
        const { error } = await supabase.from('student_skills').upsert({
          student_id: profile!.id,
          skill_name: activeCourse!.skill_name,
          source: 'course'
        });
        if (error) throw error;
        toast(`Passed! (${score}/3). ${activeCourse!.skill_name} added to your verified skills!`, 'success');
        setStudentSkills(prev => [...new Set([...prev, activeCourse!.skill_name])]);
      } catch (err: any) {
        toast(err.message || 'Failed to record verified skill', 'error');
      } finally {
        setSubmitting(false);
      }
    } else {
      toast(`Score: ${score}/3. You need 2/3 to pass. Please review and try again!`, 'error');
    }
  };

  return (
    <AppShell navItems={STUDENT_NAV}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Skill Gap Learning Modules</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Targeted micro-assessments. Pass a 3-question quiz to instantly earn verified skills for your profile.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {courses.map(c => {
            const alreadyHas = studentSkills.includes(c.skill_name);

            return (
              <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                      ⏱️ {c.duration_hours} hrs module
                    </span>
                    {alreadyHas ? (
                      <span className="chip chip-exact" style={{ fontSize: 11 }}>
                        ✓ Skill Verified
                      </span>
                    ) : (
                      <span className="chip chip-gap" style={{ fontSize: 11 }}>
                        ○ Skill Gap
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 17, marginBottom: 6 }}>{c.title}</h3>
                  <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
                    {c.description || `Comprehensive overview and practical application of ${c.skill_name} for industry readiness.`}
                  </p>
                </div>

                <div>
                  <button
                    className={`btn ${alreadyHas ? 'btn-ghost' : 'btn-primary'}`}
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleStartQuiz(c)}
                  >
                    {alreadyHas ? 'Retake Quiz' : 'Take 3-Question Quiz →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quiz Modal */}
        <Modal
          open={Boolean(activeCourse)}
          onClose={() => setActiveCourse(null)}
          title={`Assessment: ${activeCourse?.title || ''}`}
        >
          {activeCourse && (
            <div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                Answer at least 2 out of 3 questions correctly to earn the <strong>{activeCourse.skill_name}</strong> skill certification badge.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {(SKILL_QUIZZES[activeCourse.skill_name] || DEFAULT_QUIZ).map((qObj, qIdx) => (
                  <div key={qIdx} style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                      {qIdx + 1}. {qObj.q}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {qObj.options.map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 13,
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: quizAnswers[qIdx] === oIdx ? 'var(--accent-soft)' : 'transparent',
                            color: quizAnswers[qIdx] === oIdx ? 'var(--accent)' : 'var(--ink)'
                          }}
                        >
                          <input
                            type="radio"
                            name={`q-${qIdx}`}
                            checked={quizAnswers[qIdx] === oIdx}
                            onChange={() => handleSelectOption(qIdx, oIdx)}
                            style={{ width: 'auto' }}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {quizScore !== null && (
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                  background: quizScore >= 2 ? 'var(--good-soft)' : 'var(--bad-soft)',
                  color: quizScore >= 2 ? 'var(--good)' : 'var(--bad)',
                  fontWeight: 600
                }}>
                  {quizScore >= 2 ? `🎉 Passed! ${quizScore}/3 correct.` : `❌ Did not pass (${quizScore}/3). Minimum 2 required.`}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleSubmitQuiz}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit Answers'}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setActiveCourse(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
