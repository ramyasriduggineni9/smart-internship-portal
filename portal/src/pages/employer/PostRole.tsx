import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import { EMPLOYER_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SKILLS, Skill } from '../../lib/skillGraph';
import { useToast } from '../../components/ui/Toast';

export default function EmployerPostRole() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minCgpa, setMinCgpa] = useState<string>('7.0');
  const [location, setLocation] = useState('Remote');
  const [stipend, setStipend] = useState('₹20,000 / month');
  const [coursesCatalog, setCoursesCatalog] = useState<{ id: number; name: string }[]>([]);
  const [selectedPrereqs, setSelectedPrereqs] = useState<string[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    checkVerificationAndCatalog();
  }, [profile?.id]);

  async function checkVerificationAndCatalog() {
    setLoading(true);
    try {
      // 1. Check employer status
      const { data: empData } = await supabase
        .from('employers')
        .select('status')
        .eq('id', profile!.id)
        .maybeSingle();

      const verified = empData?.status === 'verified' || profile?.employer_status === 'verified';
      setIsVerified(verified);

      // 2. Fetch courses catalog
      const { data: courses } = await supabase.from('courses_catalog').select('id, name');
      setCoursesCatalog(courses || []);
    } catch (err: any) {
      toast(err.message || 'Error checking status', 'error');
    } finally {
      setLoading(false);
    }
  }

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else {
      if (selectedSkills.length >= 5) {
        toast('Maximum 5 required skills can be specified per internship', 'error');
        return;
      }
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const togglePrereq = (courseName: string) => {
    setSelectedPrereqs(prev =>
      prev.includes(courseName) ? prev.filter(c => c !== courseName) : [...prev, courseName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast('Please enter a role title', 'error');
      return;
    }
    if (selectedSkills.length < 2) {
      toast('Please select at least 2 required skills for skill-graph matching', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('internships').insert({
        employer_id: profile!.id,
        title: title.trim(),
        required_skills: selectedSkills,
        min_cgpa: parseFloat(minCgpa) || 0,
        prerequisite_courses: selectedPrereqs,
        location: location.trim(),
        stipend: stipend.trim(),
        status: 'open',
      });

      if (error) throw error;

      toast('Internship opportunity published! Students can now discover and apply.', 'success');
      navigate('/employer/dashboard');
    } catch (err: any) {
      toast(err.message || 'Failed to publish internship', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && !isVerified) {
    return (
      <AppShell navItems={EMPLOYER_NAV}>
        <div style={{ maxWidth: 700, margin: '40px auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: 40 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Corporate Verification Required</h2>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 24px' }}>
              In compliance with university placement guidelines, employers must be verified with their CIN & GSTIN before posting internships to students.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to="/employer/verify" className="btn btn-primary">
                Complete Verification Now →
              </Link>
              <Link to="/employer/dashboard" className="btn btn-ghost">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell navItems={EMPLOYER_NAV}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Post New Internship Opening</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Target student talent using the 22-node skill graph and academic criteria.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="section-title">Role Details</h3>

            <div className="form-group">
              <label>Internship Title *</label>
              <input
                type="text"
                placeholder="e.g. Backend Software Engineering Intern"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label>Work Location / Mode *</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore / Hybrid or Remote"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Monthly Stipend *</label>
                <input
                  type="text"
                  placeholder="e.g. ₹25,000 / month"
                  value={stipend}
                  onChange={e => setStipend(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Minimum Required CGPA (0.0 - 10.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={minCgpa}
                  onChange={e => setMinCgpa(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Required Skills Selection */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>Required Skills (Skill Graph) *</h3>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: selectedSkills.length >= 2 ? 'var(--good)' : 'var(--warn)' }}>
                {selectedSkills.length} / 5 Selected (Min 2)
              </span>
            </div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
              Select 2 to 5 skills from the canonical skill graph. Our engine matches students based on exact and related graph distance.
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SKILLS.map(s => {
                const isSelected = selectedSkills.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSkill(s)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--line)'}`,
                      background: isSelected ? 'var(--accent)' : 'var(--surface)',
                      color: isSelected ? 'var(--accent-fg)' : 'var(--ink)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {isSelected ? `✓ ${s}` : `+ ${s}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prerequisite Courses */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="section-title">Prerequisite Academic Courses</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>
              Students must have passed these courses in their college curriculum to be eligible.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {coursesCatalog.map(c => {
                const checked = selectedPrereqs.includes(c.name);
                return (
                  <label
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${checked ? 'var(--accent)' : 'var(--line)'}`,
                      background: checked ? 'var(--accent-soft)' : 'var(--surface)',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: checked ? 'var(--accent)' : 'var(--ink)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePrereq(c.name)}
                      style={{ width: 'auto' }}
                    />
                    <span>{c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '12px 32px', fontSize: 15 }}
            disabled={submitting || selectedSkills.length < 2}
          >
            {submitting ? 'Publishing…' : 'Publish Internship Opportunity'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
