import React, { useEffect, useState } from 'react';
import AppShell from '../../components/layout/AppShell';
import { EMPLOYER_NAV } from '../../config/nav';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

const CIN_REGEX = /^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'rediffmail.com'];

export default function EmployerVerify() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [company, setCompany] = useState('');
  const [cin, setCin] = useState('');
  const [gstin, setGstin] = useState('');
  const [website, setWebsite] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [status, setStatus] = useState<'pending' | 'verified' | 'blocked'>('pending');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    loadVerificationData();
  }, [profile?.id]);

  async function loadVerificationData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employers')
        .select('*')
        .eq('id', profile!.id)
        .maybeSingle();

      if (!error && data) {
        setCompany(data.company || profile?.full_name || '');
        setCin(data.cin || '');
        setGstin(data.gstin || '');
        setWebsite(data.website || '');
        setHrEmail(data.hr_email || profile?.email || '');
        setStatus(data.status || 'pending');
      } else {
        setCompany(profile?.full_name || '');
        setHrEmail(profile?.email || '');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to load details', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate CIN
    if (cin && !CIN_REGEX.test(cin.trim())) {
      toast('Invalid CIN format. Example: U72200MH2018PTC123456 (21 alphanumeric characters)', 'error');
      return;
    }

    // 2. Validate GSTIN
    if (gstin && !GSTIN_REGEX.test(gstin.trim())) {
      toast('Invalid GSTIN format. Example: 27AABCU9603R1ZM (15 characters)', 'error');
      return;
    }

    // 3. Validate HR Email not free public webmail
    if (hrEmail) {
      const domain = hrEmail.split('@')[1]?.toLowerCase();
      if (FREE_EMAIL_DOMAINS.includes(domain)) {
        toast(`Corporate email required. Public webmail (${domain}) is not accepted for employer verification.`, 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('employers').upsert({
        id: profile!.id,
        company: company.trim(),
        cin: cin.trim().toUpperCase(),
        gstin: gstin.trim().toUpperCase(),
        website: website.trim(),
        hr_email: hrEmail.trim(),
        status: status === 'verified' ? 'verified' : 'pending' // Preserve verified if already verified
      });

      if (error) throw error;

      toast('Corporate verification details updated! Sent to college administrator for review.', 'success');
      loadVerificationData();
    } catch (err: any) {
      toast(err.message || 'Failed to update verification details', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell navItems={EMPLOYER_NAV}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Corporate Verification & Compliance</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 24 }}>
          Government identification and corporate registration details required to recruit college students.
        </p>

        {/* Status Callout */}
        <div style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius)',
          marginBottom: 24,
          background: status === 'verified' ? 'var(--good-soft)' : status === 'blocked' ? 'var(--bad-soft)' : 'var(--warn-soft)',
          border: `1px solid ${status === 'verified' ? 'var(--good)' : status === 'blocked' ? 'var(--bad)' : 'var(--warn)'}`,
          color: status === 'verified' ? 'var(--good)' : status === 'blocked' ? 'var(--bad)' : 'var(--warn)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 18 }}>
              {status === 'verified' ? '✓' : status === 'blocked' ? '✗' : 'ℹ️'}
            </span>
            <strong style={{ fontSize: 15, textTransform: 'capitalize' }}>
              Verification Status: {status}
            </strong>
          </div>
          <p style={{ fontSize: 13, margin: 0, opacity: 0.9 }}>
            {status === 'verified'
              ? 'Your company is verified by the college administrator. You have full clearance to publish internship opportunities.'
              : status === 'blocked'
              ? 'This employer profile has been blocked by the administrator. Contact institutional support.'
              : 'Your verification submission is currently under review by the college placement office. Role publishing will unlock upon approval.'}
          </p>
        </div>

        {/* Verification Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Registered Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Acme Technologies Private Limited"
                value={company}
                onChange={e => setCompany(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label>Corporate Identity Number (CIN) *</label>
                <input
                  type="text"
                  placeholder="e.g. U72200MH2018PTC123456"
                  value={cin}
                  onChange={e => setCin(e.target.value)}
                  style={{ textTransform: 'uppercase', fontFamily: 'var(--f-mono)' }}
                  required
                />
                <span className="muted" style={{ fontSize: 11 }}>21 alphanumeric characters issued by ROC</span>
              </div>

              <div className="form-group">
                <label>Goods & Services Tax ID (GSTIN) *</label>
                <input
                  type="text"
                  placeholder="e.g. 27AABCU9603R1ZM"
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                  style={{ textTransform: 'uppercase', fontFamily: 'var(--f-mono)' }}
                  required
                />
                <span className="muted" style={{ fontSize: 11 }}>15 characters registered Indian GST number</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label>Corporate HR Email *</label>
                <input
                  type="email"
                  placeholder="e.g. hr@acme.com"
                  value={hrEmail}
                  onChange={e => setHrEmail(e.target.value)}
                  required
                />
                <span className="muted" style={{ fontSize: 11 }}>Must be on official corporate domain (not Gmail/Yahoo)</span>
              </div>

              <div className="form-group">
                <label>Official Company Website</label>
                <input
                  type="url"
                  placeholder="https://company.com"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting Details…' : 'Submit for Verification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
