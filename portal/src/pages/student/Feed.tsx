import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { STUDENT_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { matchScore, similarity } from '../../lib/skillGraph';
import { useToast } from '../../components/ui/Toast';

interface Internship {
  id: string;
  employer_id: string;
  title: string;
  required_skills: string[];
  min_cgpa: number;
  prerequisite_courses: string[];
  location: string;
  stipend: string;
  status: string;
  created_at: string;
  employer?: {
    company: string;
    website: string;
  };
}

export default function StudentFeed() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'graph' | 'keyword'>('graph');
  const [internships, setInternships] = useState<Internship[]>([]);
  const [studentSkills, setStudentSkills] = useState<string[]>([]);
  const [studentCourses, setStudentCourses] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    loadFeed();
  }, [profile?.id]);

  async function loadFeed() {
    setLoading(true);
    try {
      // 1. Fetch student skills
      const { data: skRows } = await supabase
        .from('student_skills')
        .select('skill_name')
        .eq('student_id', profile!.id);
      const mySkills = (skRows || []).map(r => r.skill_name);
      setStudentSkills(mySkills);

      // 2. Fetch student courses
      const { data: cRows } = await supabase
        .from('student_courses')
        .select('course_name')
        .eq('student_id', profile!.id);
      setStudentCourses((cRows || []).map(r => r.course_name));

      // 3. Fetch applications already made
      const { data: appRows } = await supabase
        .from('applications')
        .select('internship_id')
        .eq('student_id', profile!.id);
      setAppliedIds((appRows || []).map(r => r.internship_id));

      // 4. Fetch open internships with employer information
      const { data: intRows, error } = await supabase
        .from('internships')
        .select('*, employer:employers(company, website)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInternships(intRows || []);
    } catch (err: any) {
      toast(err.message || 'Error loading internships', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Calculate items with scores
  const evaluatedList = internships.map(item => {
    const req = item.required_skills || [];
    // 1. Graph match score
    const graphScore = matchScore(studentSkills, req).score;

    // 2. Exact keyword overlap
    const exactMatches = req.filter(r => studentSkills.some(s => s.toLowerCase() === r.toLowerCase()));
    const keywordScore = req.length > 0 ? exactMatches.length / req.length : 1;

    // 3. Categorize each required skill
    const skillAnalysis = req.map(r => {
      const isExact = studentSkills.some(s => s.toLowerCase() === r.toLowerCase());
      if (isExact) return { skill: r, status: 'exact' as const };
      // Check best similarity
      let maxSim = 0;
      for (const s of studentSkills) {
        const sim = similarity(s, r);
        if (sim > maxSim) maxSim = sim;
      }
      if (maxSim >= 0.6) return { skill: r, status: 'related' as const, sim: Math.round(maxSim * 100) };
      return { skill: r, status: 'gap' as const };
    });

    // 4. Eligibility check
    const userCgpa = Number(profile?.cgpa || 0);
    const passesCgpa = !item.min_cgpa || userCgpa >= Number(item.min_cgpa);
    const missingCourses = (item.prerequisite_courses || []).filter(c => !studentCourses.includes(c));
    const isEligible = passesCgpa && missingCourses.length === 0;

    return {
      ...item,
      graphScore: Math.round(graphScore * 100),
      keywordScore: Math.round(keywordScore * 100),
      exactMatchesCount: exactMatches.length,
      skillAnalysis,
      isEligible,
      passesCgpa,
      missingCourses,
    };
  });

  // Filter based on selected mode
  let visibleList = evaluatedList;
  let hiddenKeywordCount = 0;
  if (mode === 'keyword') {
    visibleList = evaluatedList.filter(item => {
      const match50 = item.keywordScore >= 50;
      if (!match50) hiddenKeywordCount++;
      return match50;
    });
    visibleList.sort((a, b) => b.keywordScore - a.keywordScore);
  } else {
    // Sort by graph score descending
    visibleList.sort((a, b) => b.graphScore - a.graphScore);
  }

  const handleApply = async (internshipId: string, isEligible: boolean) => {
    if (!isEligible) {
      toast('You do not meet the minimum eligibility criteria (CGPA or courses) for this role.', 'error');
      return;
    }
    setApplyingId(internshipId);
    try {
      const { error } = await supabase.from('applications').insert({
        student_id: profile!.id,
        internship_id: internshipId,
        stage: 'Applied',
        history: [{ stage: 'Applied', timestamp: new Date().toISOString() }]
      });
      if (error) throw error;
      setAppliedIds(prev => [...prev, internshipId]);
      toast('Application submitted successfully! Track it on your Kanban board.', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to submit application', 'error');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <AppShell navItems={STUDENT_NAV}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Internship Feed & Matching</h1>
            <p className="muted" style={{ fontSize: 14 }}>
              Openings ranked by intelligent skill-graph compatibility and eligibility.
            </p>
          </div>

          {/* Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            padding: 3
          }}>
            <button
              className={`btn btn-sm ${mode === 'graph' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ border: 'none' }}
              onClick={() => setMode('graph')}
            >
              🕸️ Skill-Graph Match
            </button>
            <button
              className={`btn btn-sm ${mode === 'keyword' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ border: 'none' }}
              onClick={() => setMode('keyword')}
            >
              🔍 Keyword Match
            </button>
          </div>
        </div>

        {mode === 'keyword' && hiddenKeywordCount > 0 && (
          <div style={{
            background: 'var(--warn-soft)',
            color: 'var(--warn)',
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            marginBottom: 16
          }}>
            ℹ️ Keyword filter is hiding {hiddenKeywordCount} internship(s) with &lt; 50% exact skill overlap.
            Switch to <strong>Skill-Graph Match</strong> to view roles with related skill compatibility!
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            Loading internship feed…
          </div>
        ) : visibleList.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <p className="muted">No open internships found matching your current filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {visibleList.map(item => {
              const alreadyApplied = appliedIds.includes(item.id);
              const score = mode === 'graph' ? item.graphScore : item.keywordScore;

              return (
                <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: 19 }}>{item.title}</h3>
                        <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>
                          @ {item.employer?.company || 'Verified Employer'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13, color: 'var(--muted)', flexWrap: 'wrap' }}>
                        <span>📍 {item.location || 'Remote'}</span>
                        <span>💰 {item.stipend || 'Performance Stipend'}</span>
                        <span>🎓 Min CGPA: {item.min_cgpa || 'None'}</span>
                      </div>
                    </div>

                    {/* Match Score Gauge */}
                    <div style={{
                      textAlign: 'right',
                      background: 'var(--bg)',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--line)'
                    }}>
                      <div className="muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                        {mode === 'graph' ? 'Graph Match' : 'Keyword Overlap'}
                      </div>
                      <div className="mono" style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: score >= 75 ? 'var(--good)' : score >= 50 ? 'var(--accent)' : 'var(--warn)'
                      }}>
                        {score}%
                      </div>
                    </div>
                  </div>

                  {/* Required skills breakdown */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Skill Compatibility Breakdown
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {item.skillAnalysis.map((sk, idx) => {
                        if (sk.status === 'exact') {
                          return (
                            <span key={idx} className="chip chip-exact" title="Exact match in your profile">
                              ✓ {sk.skill} (Exact)
                            </span>
                          );
                        } else if (sk.status === 'related') {
                          return (
                            <span key={idx} className="chip chip-related" title={`Inferred related knowledge (${sk.sim}%)`}>
                              ⚡ {sk.skill} (~{sk.sim}%)
                            </span>
                          );
                        } else {
                          return (
                            <span key={idx} className="chip chip-gap" title="Skill missing from profile">
                              ○ {sk.skill} (Gap)
                            </span>
                          );
                        }
                      })}
                    </div>
                  </div>

                  {/* Prerequisites info if any */}
                  {item.prerequisite_courses && item.prerequisite_courses.length > 0 && (
                    <div style={{ fontSize: 13 }}>
                      <span className="muted">Prerequisites: </span>
                      {item.prerequisite_courses.map((pc, idx) => {
                        const hasCourse = studentCourses.includes(pc);
                        return (
                          <span
                            key={idx}
                            style={{
                              marginLeft: 6,
                              color: hasCourse ? 'var(--good)' : 'var(--bad)',
                              fontWeight: 500
                            }}
                          >
                            {hasCourse ? '✓' : '✗'} {pc}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Action bar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--line)',
                    paddingTop: 12,
                    marginTop: 4,
                    flexWrap: 'wrap',
                    gap: 10
                  }}>
                    <div>
                      {!item.isEligible ? (
                        <span style={{ fontSize: 13, color: 'var(--bad)', fontWeight: 500 }}>
                          ⚠️ Ineligible: {!item.passesCgpa ? 'CGPA below minimum' : `Missing ${item.missingCourses.join(', ')}`}
                        </span>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--good)', fontWeight: 500 }}>
                          ✓ You meet all eligibility criteria
                        </span>
                      )}
                    </div>

                    <div>
                      {alreadyApplied ? (
                        <button className="btn btn-ghost" disabled>
                          ✓ Applied
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          disabled={!item.isEligible || applyingId === item.id}
                          onClick={() => handleApply(item.id, item.isEligible)}
                        >
                          {applyingId === item.id ? 'Applying…' : 'Apply Now'}
                        </button>
                      )}
                    </div>
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
