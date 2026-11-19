import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter your student email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(error.message || 'Invalid credentials.');
      }

      if (data.user) {
        // Strict role validation from profiles table
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileErr || !profile) {
          await supabase.auth.signOut();
          throw new Error('Could not verify profile. Please contact support.');
        }

        if (profile.role !== 'student') {
          // Cross-role attempt: sign out immediately
          await supabase.auth.signOut();
          const target = profile.role === 'employer' ? 'employer' : 'admin';
          throw new Error(`Access denied: This account is registered as an ${target}. Please use the ${target} login.`);
        }

        toast('Welcome back! Signed in to Student Dashboard.', 'success');
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Please enter your student email above first to receive a password reset link.');
      return;
    }
    setForgotLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      setForgotSent(true);
      toast('Password reset link sent to your email.', 'success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px 16px',
      background: 'var(--bg)'
    }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Link to="/" style={{
          fontFamily: 'var(--f-head)',
          fontWeight: 700,
          fontSize: 22,
          color: 'var(--accent)',
          textDecoration: 'none'
        }}>
          Smart Internship Portal
        </Link>
      </div>

      <div className="card" style={{ maxWidth: 440, width: '100%', padding: '32px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 20
          }}>
            🎓
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Student Login</h2>
            <p className="muted" style={{ fontSize: 13 }}>Access your internship opportunities and NOCs</p>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            background: 'var(--bad-soft)',
            color: 'var(--bad)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            marginTop: 16,
            marginBottom: 16,
            border: '1px solid var(--bad)',
            lineHeight: 1.4
          }}>
            {errorMsg}
          </div>
        )}

        {forgotSent && (
          <div style={{
            background: 'var(--good-soft)',
            color: 'var(--good)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            marginTop: 16,
            marginBottom: 16,
            lineHeight: 1.4
          }}>
            Password reset instructions have been sent to your email.
          </div>
        )}

        <form onSubmit={handleLogin} style={{ marginTop: 16 }}>
          <div className="form-group">
            <label htmlFor="student-email">Student Email ID</label>
            <input
              id="student-email"
              type="email"
              placeholder="e.g. rollnumber@college.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="student-password">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {forgotLoading ? 'Sending…' : 'Forgot password?'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="student-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: 'var(--muted)'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 10, padding: '10px 0' }}
            disabled={loading}
          >
            {loading ? 'Authenticating…' : 'Sign In as Student'}
          </button>
        </form>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)', textAlign: 'center', fontSize: 13 }}>
          <span className="muted">Don't have a student account? </span>
          <Link to="/" style={{ fontWeight: 600 }}>Create account on Welcome page</Link>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--muted)', fontSize: 13, textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
