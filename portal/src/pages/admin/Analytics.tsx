import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { ADMIN_NAV } from '../../config/nav';
import { supabase } from '../../lib/supabase';

export default function AdminAnalytics() {
  const [stagesCount, setStagesCount] = useState<Record<string, number>>({});
  const [topSkills, setTopSkills] = useState<{ skill: string; count: number }[]>([]);
  const [employerStats, setEmployerStats] = useState<{ verified: number; pending: number; blocked: number }>({
    verified: 0,
    pending: 0,
    blocked: 0,
  });
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      // 1. Applications by stage
      const { data: apps } = await supabase.from('applications').select('stage');
      const sCounts: Record<string, number> = {
        'Applied': 0,
        'Under review': 0,
        'Interview scheduled': 0,
        'Selected': 0,
        'Not selected': 0,
      };
      (apps || []).forEach(a => {
        if (sCounts[a.stage] !== undefined) sCounts[a.stage]++;
      });
      setStagesCount(sCounts);

      // 2. In-demand skills across internships
      const { data: ints } = await supabase.from('internships').select('required_skills');
      const skillCounts: Record<string, number> = {};
      (ints || []).forEach(item => {
        (item.required_skills || []).forEach((s: string) => {
          skillCounts[s] = (skillCounts[s] || 0) + 1;
        });
      });
      const sortedSkills = Object.entries(skillCounts)
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count);
      setTopSkills(sortedSkills);

      // 3. Employer stats
      const { data: emps } = await supabase.from('employers').select('status');
      const eCounts = { verified: 0, pending: 0, blocked: 0 };
      (emps || []).forEach(e => {
        if (e.status === 'verified') eCounts.verified++;
        else if (e.status === 'blocked') eCounts.blocked++;
        else eCounts.pending++;
      });
      setEmployerStats(eCounts);

      // 4. Students count
      const { data: studs } = await supabase.from('profiles').select('id').eq('role', 'student');
      setTotalStudents(studs?.length || 0);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  const maxSkillCount = topSkills.length > 0 ? Math.max(...topSkills.map(s => s.count)) : 1;
  const totalApps = Object.values(stagesCount).reduce((a, b) => a + b, 0);

  return (
    <AppShell navItems={ADMIN_NAV}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Institutional Analytics & Insights</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Cohort application velocity, employer compliance metrics, and market skill demands.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>Loading analytics…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Top Stat Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 16
            }}>
              <div className="card">
                <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Total Students</div>
                <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '6px 0', color: 'var(--ink)' }}>
                  {totalStudents}
                </div>
                <span className="muted" style={{ fontSize: 13 }}>Registered cohorts</span>
              </div>

              <div className="card">
                <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Total Applications</div>
                <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '6px 0', color: 'var(--accent)' }}>
                  {totalApps}
                </div>
                <span className="muted" style={{ fontSize: 13 }}>Across all openings</span>
              </div>

              <div className="card">
                <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Verified Employers</div>
                <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '6px 0', color: 'var(--good)' }}>
                  {employerStats.verified}
                </div>
                <span className="muted" style={{ fontSize: 13 }}>Active hiring partners</span>
              </div>

              <div className="card">
                <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Pending Vetting</div>
                <div className="mono" style={{ fontSize: 32, fontWeight: 700, margin: '6px 0', color: employerStats.pending > 0 ? 'var(--warn)' : 'var(--muted)' }}>
                  {employerStats.pending}
                </div>
                <span className="muted" style={{ fontSize: 13 }}>Companies under review</span>
              </div>
            </div>

            {/* Application Stages Distribution */}
            <div className="card">
              <h3 className="section-title">Applications by Pipeline Stage</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(stagesCount).map(([stg, count]) => {
                  const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
                  return (
                    <div key={stg}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{stg}</span>
                        <span className="mono" style={{ color: 'var(--muted)' }}>{count} ({pct}%)</span>
                      </div>
                      <div className="score-bar" style={{ height: 8 }}>
                        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* In-Demand Skills Frequency */}
            <div className="card">
              <h3 className="section-title">Most In-Demand Skills</h3>
              <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
                Frequency of skills requested by employers across all posted internships.
              </p>

              {topSkills.length === 0 ? (
                <p className="muted" style={{ fontSize: 13 }}>No skill requirements recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topSkills.slice(0, 8).map(sk => {
                    const widthPct = Math.round((sk.count / maxSkillCount) * 100);
                    return (
                      <div key={sk.skill}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>{sk.skill}</span>
                          <span className="mono" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                            {sk.count} {sk.count === 1 ? 'opening' : 'openings'}
                          </span>
                        </div>
                        <div className="score-bar" style={{ height: 8 }}>
                          <div className="score-bar-fill" style={{ width: `${widthPct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
