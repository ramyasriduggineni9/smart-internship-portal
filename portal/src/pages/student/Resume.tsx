import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { STUDENT_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { calcATS, ATSResult } from '../../lib/atsScore';
import { matchScore } from '../../lib/skillGraph';
import { useToast } from '../../components/ui/Toast';

export default function StudentResume() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [resumeText, setResumeText] = useState('');
  const [internships, setInternships] = useState<any[]>([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState('');
  const [studentSkills, setStudentSkills] = useState<string[]>([]);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  async function loadData() {
    // 1. Fetch student skills
    const { data: skRows } = await supabase
      .from('student_skills')
      .select('skill_name')
      .eq('student_id', profile!.id);
    setStudentSkills((skRows || []).map(r => r.skill_name));

    // 2. Fetch internships
    const { data: intRows } = await supabase
      .from('internships')
      .select('id, title, required_skills')
      .eq('status', 'open');
    const list = intRows || [];
    setInternships(list);
    if (list.length > 0) {
      setSelectedInternshipId(list[0].id);
    }

    // 3. Fetch past resume text if exists
    const { data: resData } = await supabase
      .from('resumes')
      .select('raw_text, ats_score')
      .eq('student_id', profile!.id)
      .maybeSingle();

    if (resData && resData.raw_text) {
      setResumeText(resData.raw_text);
    }

    // 4. Fetch learning courses catalog
    const { data: courses } = await supabase.from('learning_courses').select('*');
    setRecommendedCourses(courses || []);
  }

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      toast('Please paste your resume content to analyze', 'error');
      return;
    }
    const targetJob = internships.find(i => i.id === selectedInternshipId);
    if (!targetJob) {
      toast('Please select a target internship opportunity', 'error');
      return;
    }

    setAnalyzing(true);
    try {
      const required = targetJob.required_skills || [];
      const graphPart = matchScore(studentSkills, required).score;
      const result = calcATS(resumeText, required, studentSkills, graphPart);
      setAtsResult(result);

      // Save to resumes table
      await supabase.from('resumes').upsert({
        student_id: profile!.id,
        raw_text: resumeText,
        ats_score: result.total,
        last_analysed_at: new Date().toISOString()
      });

      toast(`ATS Analysis Complete: ${result.total}/100 points!`, 'success');
    } catch (err: any) {
      toast(err.message || 'Analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppShell navItems={STUDENT_NAV}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Resume ATS Analyzer</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Evaluate resume keyword & skill-graph readiness against any open target internship role.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Input Panel */}
          <div className="card">
            <h3 className="section-title">Resume Content</h3>

            <div className="form-group">
              <label>Target Internship Role *</label>
              <select
                value={selectedInternshipId}
                onChange={e => setSelectedInternshipId(e.target.value)}
              >
                {internships.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.required_skills?.join(', ') || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Paste Resume Text *</label>
              <textarea
                rows={12}
                placeholder="Paste your plain-text resume here including contact details, education, work experience, projects, and technologies..."
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                style={{ fontFamily: 'var(--f-mono)', fontSize: 12 }}
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? 'Evaluating Resume ATS…' : 'Analyze ATS Compatibility'}
            </button>
          </div>

          {/* Results Panel */}
          <div>
            {!atsResult ? (
              <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
                <h4 style={{ fontSize: 16, marginBottom: 6 }}>No Analysis Run Yet</h4>
                <p className="muted" style={{ fontSize: 13 }}>
                  Select an internship and click "Analyze ATS Compatibility" to see your score breakdown and skill recommendations.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Score Summary */}
                <div className="card" style={{ textAlign: 'center', padding: '24px 20px' }}>
                  <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>
                    Overall ATS Readiness Score
                  </div>
                  <div className="mono" style={{
                    fontSize: 48,
                    fontWeight: 700,
                    margin: '6px 0',
                    color: atsResult.total >= 80 ? 'var(--good)' : atsResult.total >= 60 ? 'var(--accent)' : 'var(--bad)'
                  }}>
                    {atsResult.total} <span style={{ fontSize: 20, color: 'var(--muted)', fontWeight: 400 }}>/ 100</span>
                  </div>
                  <p className="muted" style={{ fontSize: 13 }}>
                    {atsResult.total >= 80 ? 'Excellent match! Strong chance of passing recruiter screen.' : 'Moderate match. Address skill gaps below to improve.'}
                  </p>
                </div>

                {/* Score Breakdown Card */}
                <div className="card">
                  <h4 style={{ fontSize: 15, marginBottom: 12 }}>ATS Metric Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Skill Graph Match (70 pts max)</span>
                      <strong className="mono">{atsResult.graphMatch} pts</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Email & Contact Info (8 pts)</span>
                      <span style={{ color: atsResult.hasEmail ? 'var(--good)' : 'var(--bad)', fontWeight: 600 }}>
                        {atsResult.hasEmail ? '✓ Found (+8)' : '✗ Missing (0)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Education & Degree Section (7 pts)</span>
                      <span style={{ color: atsResult.hasEducation ? 'var(--good)' : 'var(--bad)', fontWeight: 600 }}>
                        {atsResult.hasEducation ? '✓ Found (+7)' : '✗ Missing (0)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Projects Section (8 pts)</span>
                      <span style={{ color: atsResult.hasProjects ? 'var(--good)' : 'var(--bad)', fontWeight: 600 }}>
                        {atsResult.hasProjects ? '✓ Found (+8)' : '✗ Missing (0)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Quantified Results / Metrics (7 pts)</span>
                      <span style={{ color: atsResult.hasQuantified ? 'var(--good)' : 'var(--bad)', fontWeight: 600 }}>
                        {atsResult.hasQuantified ? '✓ Found (+7)' : '✗ Missing (0)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skill Gaps Card */}
                <div className="card">
                  <h4 style={{ fontSize: 15, marginBottom: 8 }}>Identified Skill Gaps</h4>
                  {atsResult.gaps.length === 0 ? (
                    <p style={{ color: 'var(--good)', fontSize: 13 }}>✓ No skill gaps detected for this role!</p>
                  ) : (
                    <div>
                      <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
                        Target role requires the following skills missing from your profile:
                      </p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                        {atsResult.gaps.map(g => (
                          <span key={g} className="chip chip-gap">
                            ○ {g}
                          </span>
                        ))}
                      </div>

                      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                          Recommended Micro-Courses
                        </div>
                        {recommendedCourses
                          .filter(c => atsResult.gaps.includes(c.skill_name))
                          .map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                              <span>{c.title} ({c.skill_name})</span>
                              <Link to="/student/learning" className="btn btn-secondary btn-sm">
                                Take Quiz →
                              </Link>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
