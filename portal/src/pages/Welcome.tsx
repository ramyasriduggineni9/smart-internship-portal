import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import Footer from '../components/layout/Footer';
import Modal from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';

export default function Welcome() {
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'employer' | 'faculty' | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Student form state
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentCollege, setStudentCollege] = useState('');
  const [studentRoll, setStudentRoll] = useState('');

  // Employer form state
  const [employerCompany, setEmployerCompany] = useState('');
  const [employerEmail, setEmployerEmail] = useState('');
  const [employerPassword, setEmployerPassword] = useState('');
  const [employerCin, setEmployerCin] = useState('');
  const [employerGstin, setEmployerGstin] = useState('');
  const [employerWebsite, setEmployerWebsite] = useState('');

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail || !studentPassword || !studentName) {
      toast('Please fill in required fields', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: studentEmail,
        password: studentPassword,
        options: {
          data: {
            full_name: studentName,
            requested_role: 'student'
          }
        }
      });
      if (error) throw error;

      if (data.user) {
        // Update student profile details (college, roll number)
        await supabase.from('profiles').update({
          full_name: studentName,
          college: studentCollege,
          roll_number: studentRoll
        }).eq('id', data.user.id);

        toast('Student account created successfully! Please sign in.', 'success');
        setSignupModalOpen(false);
        setSelectedRole(null);
      }
    } catch (err: any) {
      toast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerCompany || !employerEmail || !employerPassword) {
      toast('Please fill in required company fields', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: employerEmail,
        password: employerPassword,
        options: {
          data: {
            full_name: employerCompany,
            requested_role: 'employer'
          }
        }
      });
      if (error) throw error;

      if (data.user) {
        // Upsert into employers table with pending status
        await supabase.from('employers').upsert({
          id: data.user.id,
          company: employerCompany,
          cin: employerCin,
          gstin: employerGstin,
          website: employerWebsite,
          hr_email: employerEmail,
          status: 'pending'
        });

        toast('Employer registered! Your account is pending verification.', 'success');
        setSignupModalOpen(false);
        setSelectedRole(null);
      }
    } catch (err: any) {
      toast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <TopBar onOpenSignup={() => { setSelectedRole(null); setSignupModalOpen(true); }} />

      {/* Hero Section */}
      <section style={{
        padding: '72px 24px 64px',
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          padding: '4px 14px',
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 20
        }}>
          ✦ Connected AI-Driven Internship Management
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: 700,
          lineHeight: 1.15,
          color: 'var(--ink)',
          marginBottom: 20,
          letterSpacing: '-0.02em'
        }}>
          Build skills. Discover opportunities. Get hired.
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 19px)',
          color: 'var(--muted)',
          maxWidth: 760,
          margin: '0 auto 36px',
          lineHeight: 1.6
        }}>
          Smart Internship Portal pairs skill-graph matching with verified enterprise employers,
          streamlined 3-step paperless NOC approvals, logged work hours, and automatic credit transfer into your academic gradebook.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: 16 }}
            onClick={() => { setSelectedRole(null); setSignupModalOpen(true); }}
          >
            Create account
          </button>
          <a
            href="#role-selection"
            className="btn btn-secondary"
            style={{ padding: '12px 28px', fontSize: 16 }}
          >
            Log in to portal
          </a>
        </div>
      </section>

      {/* Role Login Selection Cards */}
      <section id="role-selection" style={{
        padding: '24px 24px 64px',
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Choose Your Portal Login</h2>
          <p className="muted" style={{ fontSize: 15 }}>Select your role to access your dedicated workspace and tools.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 20
        }}>
          {/* Student Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                marginBottom: 16
              }}>
                🎓
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>Student Portal</h3>
              <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
                Explore skill-graph matches, submit applications, track your Kanban status, complete NOC approvals, and log verified internship hours.
              </p>
              <ul style={{ fontSize: 13, color: 'var(--muted)', paddingLeft: 18, marginBottom: 20, lineHeight: 1.7 }}>
                <li>Weighted graph-matching score</li>
                <li>ATS resume evaluation</li>
                <li>Interactive skill gap courses</li>
                <li>Paperless NOC workflow</li>
              </ul>
            </div>
            <Link to="/student/login" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              Student Sign In →
            </Link>
          </div>

          {/* Employer Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: 'var(--warn-soft)',
                color: 'var(--warn)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                marginBottom: 16
              }}>
                🏢
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>Employer Portal</h3>
              <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
                Post internship openings with precise required skills, review matched candidates, manage stages, and submit final intern evaluations.
              </p>
              <ul style={{ fontSize: 13, color: 'var(--muted)', paddingLeft: 18, marginBottom: 20, lineHeight: 1.7 }}>
                <li>Company verification (CIN & GSTIN)</li>
                <li>Post skill-targeted internships</li>
                <li>Applicant tracking Kanban</li>
                <li>Intern performance evaluations</li>
              </ul>
            </div>
            <Link to="/employer/login" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              Employer Sign In →
            </Link>
          </div>

          {/* Faculty / Admin Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: 'var(--good-soft)',
                color: 'var(--good)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                marginBottom: 16
              }}>
                🏛️
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>Faculty & Admin</h3>
              <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
                Secure portal for College Mentors, HODs, and Placement Officers to execute cryptographic NOC e-signatures, verify employers, and push credits.
              </p>
              <ul style={{ fontSize: 13, color: 'var(--muted)', paddingLeft: 18, marginBottom: 20, lineHeight: 1.7 }}>
                <li>3-Tier sequential NOC signatures</li>
                <li>Employer verification review</li>
                <li>Academic gradebook credit transfer</li>
                <li>Cohort performance analytics</li>
              </ul>
            </div>
            <Link to="/admin/login" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              Faculty & Admin Sign In →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{
        padding: '56px 24px',
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
        borderTop: '1px solid var(--line)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>How It Works</h2>
          <p className="muted" style={{ fontSize: 15 }}>Five simple steps from skill profiling to academic gradebook credits.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16
        }}>
          {[
            { step: '01', title: 'Profile & Skills', desc: 'Add your skills, coursework, and college details to initialize your profile graph.' },
            { step: '02', title: 'Skill-Graph Match', desc: 'Our 22-node weighted graph calculates precise match scores with related skill inference.' },
            { step: '03', title: 'Apply & Screen', desc: 'Pass CGPA and prerequisite eligibility checks, then apply with one click.' },
            { step: '04', title: 'Kanban & NOC', desc: 'Track interview stages and trigger seamless 3-signatory NOC e-approvals upon selection.' },
            { step: '05', title: 'Hours & Credits', desc: 'Log 120 verified work hours, receive employer evaluation, and auto-award academic credits.' }
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ padding: 18 }}>
              <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>
                STEP {item.step}
              </div>
              <h4 style={{ fontSize: 16, marginBottom: 8 }}>{item.title}</h4>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />

      {/* Signup Modal */}
      <Modal open={signupModalOpen} onClose={() => { setSignupModalOpen(false); setSelectedRole(null); }} title="Create Your Account">
        {!selectedRole ? (
          <div>
            <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
              Select the account type you would like to register:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '14px 16px', gap: 12 }}
                onClick={() => setSelectedRole('student')}
              >
                <span style={{ fontSize: 20 }}>🎓</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Student Account</div>
                  <div className="muted" style={{ fontSize: 12 }}>For college students looking for internships</div>
                </div>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', padding: '14px 16px', gap: 12 }}
                onClick={() => setSelectedRole('employer')}
              >
                <span style={{ fontSize: 20 }}>🏢</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Employer Account</div>
                  <div className="muted" style={{ fontSize: 12 }}>For companies posting internships and hiring students</div>
                </div>
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', padding: '14px 16px', gap: 12, border: '1px solid var(--line)' }}
                onClick={() => setSelectedRole('faculty')}
              >
                <span style={{ fontSize: 20 }}>🏛️</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Faculty & Administrator</div>
                  <div className="muted" style={{ fontSize: 12 }}>For Mentors, HODs, and Placement Officers</div>
                </div>
              </button>
            </div>
          </div>
        ) : selectedRole === 'student' ? (
          <form onSubmit={handleStudentSignup}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16 }}>Student Registration</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedRole(null)}>
                ← Change Role
              </button>
            </div>

            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Student Email ID *</label>
              <input
                type="email"
                placeholder="student@example.edu"
                value={studentEmail}
                onChange={e => setStudentEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={studentPassword}
                onChange={e => setStudentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>College Name (Free text)</label>
              <input
                type="text"
                placeholder="e.g. National Institute of Technology"
                value={studentCollege}
                onChange={e => setStudentCollege(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Roll / Registration Number</label>
              <input
                type="text"
                placeholder="e.g. 21BCE1042"
                value={studentRoll}
                onChange={e => setStudentRoll(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Creating Account…' : 'Register as Student'}
            </button>
          </form>
        ) : selectedRole === 'employer' ? (
          <form onSubmit={handleEmployerSignup}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16 }}>Employer Registration</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedRole(null)}>
                ← Change Role
              </button>
            </div>

            <div style={{ background: 'var(--warn-soft)', color: 'var(--warn)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 16 }}>
              ℹ️ Employer accounts are created in <strong>pending verification</strong> state until reviewed by an administrator.
            </div>

            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Acme Technologies Pvt Ltd"
                value={employerCompany}
                onChange={e => setEmployerCompany(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Corporate / HR Email *</label>
              <input
                type="email"
                placeholder="hr@acme.com"
                value={employerEmail}
                onChange={e => setEmployerEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={employerPassword}
                onChange={e => setEmployerPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Company CIN (Corporate ID Number)</label>
              <input
                type="text"
                placeholder="e.g. U72200MH2018PTC123456"
                value={employerCin}
                onChange={e => setEmployerCin(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Company GSTIN</label>
              <input
                type="text"
                placeholder="e.g. 27AABCU9603R1ZM"
                value={employerGstin}
                onChange={e => setEmployerGstin(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Company Website</label>
              <input
                type="url"
                placeholder="https://company.com"
                value={employerWebsite}
                onChange={e => setEmployerWebsite(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Submitting…' : 'Register Employer Account'}
            </button>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16 }}>Faculty & Admin Access</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedRole(null)}>
                ← Change Role
              </button>
            </div>

            <div style={{
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              padding: '16px',
              borderRadius: 'var(--radius)',
              fontSize: 14,
              lineHeight: 1.6,
              marginBottom: 16
            }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Institutionally Authorized Accounts Only</p>
              <p style={{ marginBottom: 8 }}>
                Faculty and Administrator accounts cannot be self-registered through this public portal.
                Accounts for College Mentors, Heads of Department (HODs), and Placement Officers are issued and authorized directly by the college administrator.
              </p>
              <p>
                If you are a faculty member, please contact your institution's Smart Internship Portal administrator.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/admin/login" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Proceed to Admin Login
              </Link>
              <button type="button" className="btn btn-ghost" onClick={() => setSignupModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
