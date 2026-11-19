import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { STUDENT_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SKILLS, Skill } from '../../lib/skillGraph';
import { useToast } from '../../components/ui/Toast';

export default function StudentProfile() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState<number>(1);
  const [cgpa, setCgpa] = useState<string>('0');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [about, setAbout] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  // Skills & courses
  const [studentSkills, setStudentSkills] = useState<{ skill_name: string; source: string }[]>([]);
  const [selectedSkillToAdd, setSelectedSkillToAdd] = useState<string>('');
  const [coursesCatalog, setCoursesCatalog] = useState<{ id: number; name: string }[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // Eligibility counter
  const [eligibleCount, setEligibleCount] = useState<number>(0);
  const [totalRoles, setTotalRoles] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadProfile();
    loadCatalogAndSkills();
  }, [profile?.id]);

  async function loadProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile!.id)
      .single();

    if (!error && data) {
      setFullName(data.full_name || '');
      setCollege(data.college || '');
      setRollNumber(data.roll_number || '');
      setPhone(data.phone || '');
      setDepartment(data.department || '');
      setYear(data.year || 1);
      setCgpa(String(data.cgpa || 0));
      setGithub(data.github || '');
      setLinkedin(data.linkedin || '');
      setAbout(data.about || '');
      setInterests(data.interests || []);
    }
  }

  async function loadCatalogAndSkills() {
    // 1. Load catalog
    const { data: courses } = await supabase.from('courses_catalog').select('id, name');
    setCoursesCatalog(courses || []);

    // 2. Load student completed courses
    const { data: stCourses } = await supabase
      .from('student_courses')
      .select('course_name')
      .eq('student_id', profile!.id);
    setSelectedCourses((stCourses || []).map(c => c.course_name));

    // 3. Load student skills
    const { data: stSkills } = await supabase
      .from('student_skills')
      .select('skill_name, source')
      .eq('student_id', profile!.id);
    setStudentSkills(stSkills || []);

    // 4. Calculate eligibility
    const { data: internships } = await supabase.from('internships').select('*').eq('status', 'open');
    const allInts = internships || [];
    setTotalRoles(allInts.length);

    const userCgpa = Number(profile?.cgpa || 0);
    const userCourses = (stCourses || []).map(c => c.course_name);

    let eligible = 0;
    for (const job of allInts) {
      const passesCgpa = !job.min_cgpa || userCgpa >= Number(job.min_cgpa);
      const passesPrereqs = !job.prerequisite_courses || job.prerequisite_courses.every((pc: string) => userCourses.includes(pc));
      if (passesCgpa && passesPrereqs) eligible++;
    }
    setEligibleCount(eligible);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Update profiles
      const { error: profErr } = await supabase.from('profiles').update({
        full_name: fullName,
        college,
        roll_number: rollNumber,
        phone,
        department,
        year: Number(year),
        cgpa: parseFloat(cgpa) || 0,
        github,
        linkedin,
        about,
        interests,
      }).eq('id', profile!.id);

      if (profErr) throw profErr;

      // 2. Sync courses
      await supabase.from('student_courses').delete().eq('student_id', profile!.id);
      if (selectedCourses.length > 0) {
        const rows = selectedCourses.map(c => ({
          student_id: profile!.id,
          course_name: c,
        }));
        await supabase.from('student_courses').insert(rows);
      }

      toast('Profile updated successfully!', 'success');
      loadCatalogAndSkills();
    } catch (err: any) {
      toast(err.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    if (!selectedSkillToAdd) return;
    if (studentSkills.some(s => s.skill_name === selectedSkillToAdd)) {
      toast('Skill already added', 'error');
      return;
    }
    const { error } = await supabase.from('student_skills').insert({
      student_id: profile!.id,
      skill_name: selectedSkillToAdd,
      source: 'manual',
    });
    if (!error) {
      setStudentSkills(prev => [...prev, { skill_name: selectedSkillToAdd, source: 'manual' }]);
      setSelectedSkillToAdd('');
      toast(`Added ${selectedSkillToAdd}`, 'success');
    } else {
      toast(error.message, 'error');
    }
  };

  const handleRemoveSkill = async (skillName: string) => {
    const { error } = await supabase
      .from('student_skills')
      .delete()
      .eq('student_id', profile!.id)
      .eq('skill_name', skillName);
    if (!error) {
      setStudentSkills(prev => prev.filter(s => s.skill_name !== skillName));
      toast(`Removed ${skillName}`, 'success');
    }
  };

  const toggleCourse = (courseName: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseName) ? prev.filter(c => c !== courseName) : [...prev, courseName]
    );
  };

  const addInterest = () => {
    if (interestsInput.trim() && !interests.includes(interestsInput.trim())) {
      setInterests(prev => [...prev, interestsInput.trim()]);
      setInterestsInput('');
    }
  };

  const removeInterest = (item: string) => {
    setInterests(prev => prev.filter(i => i !== item));
  };

  return (
    <AppShell navItems={STUDENT_NAV}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Student Profile & Skills</h1>
            <p className="muted" style={{ fontSize: 14 }}>
              Maintain your academic credentials and verified skill stack.
            </p>
          </div>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            padding: '8px 16px',
            borderRadius: 'var(--radius)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--accent)'
          }}>
            Eligible for {eligibleCount} of {totalRoles} open roles
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Academic & Basic Info */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="section-title">Academic & Contact Information</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>College Name (Free text)</label>
                <input
                  type="text"
                  placeholder="e.g. National Institute of Technology"
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Roll / Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. 21BCE1042"
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Department / Branch</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science and Engineering"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Current Year of Study</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))}>
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                  <option value={5}>Postgraduate</option>
                </select>
              </div>

              <div className="form-group">
                <label>Cumulative CGPA (0.0 - 10.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpa}
                  onChange={e => setCgpa(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>GitHub Profile URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={github}
                  onChange={e => setGithub(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>LinkedIn Profile URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 12 }}>
              <label>About / Bio</label>
              <textarea
                rows={3}
                placeholder="Brief summary of your background, career interests and aspirations..."
                value={about}
                onChange={e => setAbout(e.target.value)}
              />
            </div>

            {/* Interests tags */}
            <div className="form-group" style={{ marginTop: 8 }}>
              <label>Areas of Interest</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. Cloud Computing, AI, Backend Systems"
                  value={interestsInput}
                  onChange={e => setInterestsInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={addInterest}>
                  Add Tag
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {interests.map(tag => (
                  <span key={tag} className="chip chip-neutral" style={{ cursor: 'pointer' }} onClick={() => removeInterest(tag)}>
                    {tag} ✕
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Skills Management */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="section-title">Verified Skills (Skill Graph)</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Add skills from the 22 canonical skill graph nodes to boost your automated match scores.
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <select
                value={selectedSkillToAdd}
                onChange={e => setSelectedSkillToAdd(e.target.value)}
                style={{ maxWidth: 300 }}
              >
                <option value="">Select a skill to add...</option>
                {SKILLS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="button" className="btn btn-secondary" onClick={handleAddSkill}>
                + Add Skill
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {studentSkills.length === 0 ? (
                <p className="muted" style={{ fontSize: 13 }}>No skills added yet. Select and add skills above.</p>
              ) : (
                studentSkills.map(sk => (
                  <span key={sk.skill_name} className="chip chip-exact" style={{ padding: '6px 12px' }}>
                    {sk.skill_name}
                    <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>({sk.source})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(sk.skill_name)}
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 6, fontSize: 12 }}
                      aria-label="Remove skill"
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Completed Courses */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="section-title">Completed College Courses</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Select prerequisite courses you have successfully passed for internship eligibility.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {coursesCatalog.map(c => {
                const checked = selectedCourses.includes(c.name);
                return (
                  <label
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${checked ? 'var(--accent)' : 'var(--line)'}`,
                      background: checked ? 'var(--accent-soft)' : 'var(--surface)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 500,
                      color: checked ? 'var(--accent)' : 'var(--ink)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCourse(c.name)}
                      style={{ width: 'auto' }}
                    />
                    <span>{c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 15 }} disabled={saving}>
            {saving ? 'Saving Profile…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
