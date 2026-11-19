import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { ADMIN_NAV } from '../../config/nav';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

interface FacultyMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  faculty_title: 'Mentor' | 'HOD' | 'Placement Officer' | null;
}

export default function AdminCreateFaculty() {
  const { toast } = useToast();
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Promote existing user form state
  const [targetEmail, setTargetEmail] = useState('');
  const [selectedTitle, setSelectedTitle] = useState<'Mentor' | 'HOD' | 'Placement Officer'>('Mentor');
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    loadFaculty();
  }, []);

  async function loadFaculty() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, faculty_title')
        .eq('role', 'admin');

      if (error) throw error;
      setFacultyList((data || []) as FacultyMember[]);
    } catch (err: any) {
      toast(err.message || 'Failed to load faculty', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handlePromoteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      toast('Please enter the user email', 'error');
      return;
    }

    setPromoting(true);
    try {
      // Find user by email
      const { data: userRecord, error: searchErr } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', targetEmail.trim())
        .maybeSingle();

      if (searchErr || !userRecord) {
        toast('User not found. The user must first register an account on the portal before they can be assigned faculty permissions.', 'error');
        return;
      }

      // Update role and faculty_title
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          faculty_title: selectedTitle,
        })
        .eq('id', userRecord.id);

      if (updateErr) throw updateErr;

      toast(`Successfully assigned ${selectedTitle} role to ${userRecord.full_name || targetEmail}!`, 'success');
      setTargetEmail('');
      loadFaculty();
    } catch (err: any) {
      toast(err.message || 'Failed to assign role', 'error');
    } finally {
      setPromoting(false);
    }
  };

  const handleUpdateTitle = async (userId: string, newTitle: 'Mentor' | 'HOD' | 'Placement Officer') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ faculty_title: newTitle })
        .eq('id', userId);

      if (error) throw error;

      toast(`Faculty title updated to: ${newTitle}`, 'success');
      setFacultyList(prev => prev.map(f => f.id === userId ? { ...f, faculty_title: newTitle } : f));
    } catch (err: any) {
      toast(err.message || 'Failed to update title', 'error');
    }
  };

  return (
    <AppShell navItems={ADMIN_NAV}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Faculty & Role Administration</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Designate institutional roles for the NOC approval chain (Mentor, HOD, Placement Officer).
        </p>

        {/* Promote Form */}
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 className="section-title">Assign Faculty Role to Registered Account</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Users who register with their institutional email can be upgraded to Faculty/Admin status below.
          </p>

          <form onSubmit={handlePromoteUser}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label>Registered User Email *</label>
                <input
                  type="email"
                  placeholder="e.g. mentor@college.edu"
                  value={targetEmail}
                  onChange={e => setTargetEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Faculty Title / Clearance *</label>
                <select
                  value={selectedTitle}
                  onChange={e => setSelectedTitle(e.target.value as any)}
                >
                  <option value="Mentor">Faculty Mentor (Step 1 NOC)</option>
                  <option value="HOD">Head of Department - HOD (Step 2 NOC)</option>
                  <option value="Placement Officer">Placement Officer (Step 3 NOC)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={promoting}>
              {promoting ? 'Assigning Permissions…' : 'Assign Faculty Role →'}
            </button>
          </form>
        </div>

        {/* Existing Faculty Roster */}
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 className="section-title">Authorized Faculty & Admin Roster</h3>

          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>Loading faculty…</div>
          ) : facultyList.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, padding: '12px 0' }}>No admin accounts registered yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Designated NOC Role</th>
                    <th>Update Title</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyList.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.full_name || 'Admin User'}</td>
                      <td className="muted" style={{ fontSize: 13 }}>{item.email}</td>
                      <td>
                        <span className="chip" style={{ background: 'var(--bad-soft)', color: 'var(--bad)', fontWeight: 700 }}>
                          {item.faculty_title || 'General Admin'}
                        </span>
                      </td>
                      <td>
                        <select
                          value={item.faculty_title || 'Mentor'}
                          onChange={e => handleUpdateTitle(item.id, e.target.value as any)}
                          style={{ fontSize: 12, padding: '4px 8px', maxWidth: 160 }}
                        >
                          <option value="Mentor">Mentor</option>
                          <option value="HOD">HOD</option>
                          <option value="Placement Officer">Placement Officer</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Supabase SQL Instructions Callout */}
        <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}>
          <h4 style={{ fontSize: 15, marginBottom: 8 }}>💡 Manual SQL Command for Direct Database Authorization</h4>
          <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
            To bootstrap or manually promote any user in the Supabase SQL editor:
          </p>
          <pre style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            padding: 12,
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--f-mono)',
            fontSize: 12,
            overflowX: 'auto',
            color: 'var(--accent)'
          }}>
{`-- Run in Supabase SQL Editor to grant admin role:
UPDATE public.profiles
SET role = 'admin', faculty_title = 'Mentor' -- or 'HOD', 'Placement Officer'
WHERE email = 'your-email@college.edu';`}
          </pre>
        </div>
      </div>
    </AppShell>
  );
}
