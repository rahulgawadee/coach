'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const inputBase = {
  width: '100%',
  padding: '0.75rem 1rem',
  fontSize: '0.9375rem',
  border: '1px solid #E2DDD8',
  borderRadius: '10px',
  outline: 'none',
  background: '#FAFAF8',
  color: '#1A1916',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

function Field({ label, optional, textarea, rows = 4, ...props }) {
  const [focused, setFocused] = useState(false);
  const style = {
    ...inputBase,
    borderColor: focused ? '#B8A99A' : '#E2DDD8',
    boxShadow: focused ? '0 0 0 3px rgba(184,169,154,0.18)' : 'none',
    ...(textarea ? { resize: 'vertical', lineHeight: 1.6 } : {}),
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#5C5751', letterSpacing: '0.01em', display: 'flex', gap: '6px', alignItems: 'center' }}>
        {label}
        {optional && <span style={{ fontWeight: 400, color: '#A09990', fontSize: '0.75rem' }}>optional</span>}
      </label>
      {textarea
        ? <textarea {...props} rows={rows} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={style} />
        : <input {...props} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={style} />}
    </div>
  );
}

const EXPERTISE_AREAS = ['IT & Technology', 'Healthcare', 'Construction', 'Finance', 'Education', 'Manufacturing', 'Retail & Trade'];

const STEPS = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Company' },
  { id: 3, label: 'Expertise' },
  { id: 4, label: 'Contact' },
  { id: 5, label: 'Capacity' },
  { id: 6, label: 'Agreement' },
];

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState('candidate');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    fullName: '', phoneNumber: '', companyName: '',
    companyRegistrationNumber: '', governmentAgencyId: '',
    bio: '', expertiseAreas: [], yearsOfExperience: '',
    certifications: '', contactPersonName: '',
    maxCandidates: '15',
    preferredWorkingHours: { startTime: '09:00', endTime: '17:00' },
    agreeToTermsOfService: false,
    confirmedRegisteredSupplier: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'coach') setRole('coach');
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const toggleExpertise = (area) => {
    setFormData((prev) => ({
      ...prev,
      expertiseAreas: prev.expertiseAreas.includes(area)
        ? prev.expertiseAreas.filter((a) => a !== area)
        : [...prev.expertiseAreas, area],
    }));
  };

  const validateStep = (s) => {
    const errs = [];
    if (s === 1) {
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.push('Valid email is required');
      if (!formData.password || formData.password.length < 8) errs.push('Password must be at least 8 characters');
      if (formData.password !== formData.confirmPassword) errs.push('Passwords do not match');
      if (!formData.fullName.trim()) errs.push('Full name is required');
    } else if (s === 2) {
      if (!formData.companyName.trim()) errs.push('Company name is required');
      if (!formData.companyRegistrationNumber.trim()) errs.push('Company registration number is required');
      if (!formData.governmentAgencyId.trim()) errs.push('Government agency ID is required');
    } else if (s === 3) {
      if (!formData.bio.trim()) errs.push('Bio is required');
      if (formData.expertiseAreas.length === 0) errs.push('Select at least one expertise area');
      if (!formData.yearsOfExperience) errs.push('Years of experience is required');
    } else if (s === 4) {
      if (!formData.phoneNumber.trim()) errs.push('Phone number is required');
    } else if (s === 5) {
      const n = parseInt(formData.maxCandidates);
      if (n < 5 || n > 50) errs.push('Must be between 5 and 50 candidates');
    } else if (s === 6) {
      if (!formData.agreeToTermsOfService) errs.push('You must agree to the terms of service');
      if (!formData.confirmedRegisteredSupplier) errs.push('You must confirm registered supplier status');
    }
    if (errs.length) { setError(errs[0]); return false; }
    return true;
  };

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    setIsLoading(true);
    try {
      const result = await register(formData.email, formData.password, formData.confirmPassword, 'Candidate', formData.email.split('@')[0]);
      if (!result.success) setError(result.error || 'Registration failed');
      else router.push('/candidate/step1');
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally { setIsLoading(false); }
  };

  const handleCoachNext = () => { if (validateStep(step)) { setStep(step + 1); setError(''); } };
  const handleCoachBack = () => { setStep(step - 1); setError(''); };

  const handleCoachSubmit = async () => {
    if (!validateStep(step)) return;
    setIsLoading(true);
    try {
      const regResult = await register(formData.email, formData.password, formData.confirmPassword, 'Coach', formData.fullName);
      if (!regResult.success) { setError(regResult.error || 'Registration failed'); return; }
      const res = await fetch('/api/coach/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email, fullName: formData.fullName, phoneNumber: formData.phoneNumber,
          companyName: formData.companyName, companyRegistrationNumber: formData.companyRegistrationNumber,
          governmentAgencyId: formData.governmentAgencyId, bio: formData.bio,
          expertiseAreas: formData.expertiseAreas, yearsOfExperience: parseInt(formData.yearsOfExperience),
          certifications: formData.certifications, contactPersonName: formData.contactPersonName,
          maxCandidates: parseInt(formData.maxCandidates), preferredWorkingHours: formData.preferredWorkingHours,
          agreeToTermsOfService: formData.agreeToTermsOfService, confirmedRegisteredSupplier: formData.confirmedRegisteredSupplier,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create coach profile'); return; }
      router.push('/coach/dashboard');
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally { setIsLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F5F2',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '2.5rem 1rem',

      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #BDB8B2; }
        textarea { font-family: inherit; }
        .primary-btn { transition: background 0.15s, transform 0.1s; }
        .primary-btn:hover:not(:disabled) { background: #1A1916 !important; }
        .primary-btn:active:not(:disabled) { transform: scale(0.985); }
        .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .secondary-btn { transition: background 0.15s; }
        .secondary-btn:hover:not(:disabled) { background: #EEEBE8 !important; }
        .role-card { transition: border-color 0.15s, background 0.15s; cursor: pointer; }
        .expertise-chip { transition: all 0.15s; cursor: pointer; user-select: none; }
        .expertise-chip:hover { border-color: #B8A99A !important; }
        .agree-row { transition: background 0.15s; cursor: pointer; }
        .agree-row:hover { background: #F7F5F2 !important; }
        a { text-decoration: none; }
      `}</style>

      <div style={{ width: '100%', maxWidth: role === 'coach' ? '560px' : '420px', transition: 'max-width 0.3s' }}>



        {/* Role selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem', marginTop: '80px' }}>
          {[
            { key: 'candidate', icon: '◎', title: 'Candidate', desc: 'Seeking mentorship & career growth' },
            { key: 'coach', icon: '◈', title: 'Coach / Mentor', desc: 'Share expertise & guide others' },
          ].map(({ key, icon, title, desc }) => {
            const active = role === key;
            return (
              <div
                key={key}
                className="role-card"
                onClick={() => { setRole(key); setStep(1); setError(''); }}
                style={{
                  background: active ? '#FFFFFF' : '#EEEBE8',
                  border: `1.5px solid ${active ? '#2C2925' : '#E2DDD8'}`,
                  borderRadius: '12px',
                  padding: '1rem 1.125rem',
                }}
              >
                <div style={{ fontSize: '1.125rem', marginBottom: '6px', color: active ? '#2C2925' : '#9C9690' }}>{icon}</div>
                <p style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 600, color: active ? '#1A1916' : '#6B6560' }}>{title}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: active ? '#6B6560' : '#9C9690', lineHeight: 1.4 }}>{desc}</p>
              </div>
            );
          })}
        </div>

        {/* Main Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E8E4E0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)',
        }}>

          {/* Coach step progress */}
          {role === 'coach' && (
            <div style={{ padding: '1.25rem 2rem 0', borderBottom: '1px solid #F0EDE9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                {STEPS.map((s) => (
                  <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: s.id < step ? '#2C2925' : s.id === step ? '#2C2925' : '#E8E4E0',
                      border: s.id === step ? '2px solid #2C2925' : '2px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 600,
                      color: s.id <= step ? '#F7F5F2' : '#A09990',
                      transition: 'all 0.2s',
                    }}>
                      {s.id < step ? '✓' : s.id}
                    </div>
                    <span style={{ fontSize: '0.625rem', color: s.id === step ? '#2C2925' : '#A09990', fontWeight: s.id === step ? 600 : 400, letterSpacing: '0.02em' }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: '2rem' }}>

            {/* Error */}
            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#B91C1C' }}>{error}</p>
              </div>
            )}

            {/* CANDIDATE FORM */}
            {role === 'candidate' && (
              <form onSubmit={handleCandidateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Field label="Email address" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} disabled={isLoading} required />
                <Field label="Password" type="password" name="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} disabled={isLoading} required />
                <Field label="Confirm password" type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} required />

                <label className="agree-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E8E4E0', marginTop: '0.25rem' }}>
                  <input type="checkbox" required disabled={isLoading} style={{ marginTop: '2px', accentColor: '#2C2925', width: '15px', height: '15px', flexShrink: 0, cursor: 'pointer' }} />
                  <span style={{ fontSize: '0.8125rem', color: '#5C5751', lineHeight: 1.5 }}>
                    I agree to the{' '}
                    <a href="#" style={{ color: '#2C2925', fontWeight: 500 }}>Terms of Service</a> and{' '}
                    <a href="#" style={{ color: '#2C2925', fontWeight: 500 }}>Privacy Policy</a>
                  </span>
                </label>

                <button type="submit" className="primary-btn" disabled={isLoading} style={{ marginTop: '0.5rem', width: '100%', padding: '0.8125rem', background: '#2C2925', color: '#F7F5F2', border: 'none', borderRadius: '10px', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {isLoading ? 'Creating account…' : 'Create account'}
                </button>
              </form>
            )}

            {/* COACH MULTI-STEP */}
            {role === 'coach' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {step === 1 && (
                  <>
                    <Field label="Full name" type="text" name="fullName" placeholder="Jane Doe" value={formData.fullName} onChange={handleChange} disabled={isLoading} required />
                    <Field label="Email address" type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} disabled={isLoading} required />
                    <Field label="Password" type="password" name="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} disabled={isLoading} required />
                    <Field label="Confirm password" type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} required />
                  </>
                )}

                {step === 2 && (
                  <>
                    <Field label="Company name" type="text" name="companyName" placeholder="Your Company AB" value={formData.companyName} onChange={handleChange} disabled={isLoading} required />
                    <Field label="Swedish org number" type="text" name="companyRegistrationNumber" placeholder="123456-7890" value={formData.companyRegistrationNumber} onChange={handleChange} disabled={isLoading} required />
                    <Field label="Arbetsförmedlingen supplier ID" type="text" name="governmentAgencyId" placeholder="Supplier ID" value={formData.governmentAgencyId} onChange={handleChange} disabled={isLoading} required />
                  </>
                )}

                {step === 3 && (
                  <>
                    <Field label="Bio" textarea name="bio" placeholder="Tell us about your experience and approach…" value={formData.bio} onChange={handleChange} disabled={isLoading} required />

                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#5C5751', display: 'block', marginBottom: '10px' }}>
                        Expertise areas
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {EXPERTISE_AREAS.map((area) => {
                          const selected = formData.expertiseAreas.includes(area);
                          return (
                            <div key={area} className="expertise-chip" onClick={() => toggleExpertise(area)} style={{
                              padding: '6px 14px', borderRadius: '100px',
                              border: `1.5px solid ${selected ? '#2C2925' : '#E2DDD8'}`,
                              background: selected ? '#2C2925' : '#FAFAF8',
                              color: selected ? '#F7F5F2' : '#5C5751',
                              fontSize: '0.8125rem', fontWeight: selected ? 500 : 400,
                            }}>
                              {area}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <Field label="Years of experience" type="number" name="yearsOfExperience" placeholder="10" value={formData.yearsOfExperience} onChange={handleChange} disabled={isLoading} required />
                      <Field label="Certifications" optional type="text" name="certifications" placeholder="e.g. PMP, ICF" value={formData.certifications} onChange={handleChange} disabled={isLoading} />
                    </div>
                  </>
                )}

                {step === 4 && (
                  <>
                    <Field label="Phone number" type="tel" name="phoneNumber" placeholder="+46 123 456 789" value={formData.phoneNumber} onChange={handleChange} disabled={isLoading} required />
                    <Field label="Contact person name" optional type="text" name="contactPersonName" placeholder="If different from you" value={formData.contactPersonName} onChange={handleChange} disabled={isLoading} />
                  </>
                )}

                {step === 5 && (
                  <>
                    <Field
                      label="Max candidates (5–50)"
                      type="number"
                      name="maxCandidates"
                      placeholder="15"
                      value={formData.maxCandidates}
                      onChange={handleChange}
                      disabled={isLoading}
                      min="5" max="50" required
                    />

                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#5C5751', display: 'block', marginBottom: '10px' }}>
                        Preferred working hours
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[['startTime', 'From'], ['endTime', 'To']].map(([field, lbl]) => (
                          <div key={field}>
                            <label style={{ fontSize: '0.75rem', color: '#9C9690', display: 'block', marginBottom: '6px' }}>{lbl}</label>
                            <input
                              type="time"
                              value={formData.preferredWorkingHours[field]}
                              onChange={(e) => setFormData((prev) => ({ ...prev, preferredWorkingHours: { ...prev.preferredWorkingHours, [field]: e.target.value } }))}
                              style={{ ...inputBase, padding: '0.7rem 0.875rem' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {step === 6 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { key: 'agreeToTermsOfService', text: 'I agree to the Terms of Service and Privacy Policy' },
                      { key: 'confirmedRegisteredSupplier', text: 'I confirm I am a registered supplier with the Swedish Employment Agency (Arbetsförmedlingen)' },
                    ].map(({ key, text }) => (
                      <label key={key} className="agree-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '1rem', borderRadius: '10px', border: `1px solid ${formData[key] ? '#2C2925' : '#E8E4E0'}`, background: formData[key] ? '#F7F5F2' : '#FFFFFF' }}>
                        <input
                          type="checkbox"
                          name={key}
                          checked={formData[key]}
                          onChange={handleChange}
                          disabled={isLoading}
                          style={{ marginTop: '2px', accentColor: '#2C2925', width: '15px', height: '15px', flexShrink: 0, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.8125rem', color: '#5C5751', lineHeight: 1.5 }}>{text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Nav buttons */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                  {step > 1 && (
                    <button type="button" className="secondary-btn" onClick={handleCoachBack} disabled={isLoading} style={{ flex: 1, padding: '0.8125rem', background: '#F0EDE9', color: '#5C5751', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                      ← Back
                    </button>
                  )}
                  {step < 6 ? (
                    <button type="button" className="primary-btn" onClick={handleCoachNext} disabled={isLoading} style={{ flex: 1, padding: '0.8125rem', background: '#2C2925', color: '#F7F5F2', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Continue →
                    </button>
                  ) : (
                    <button type="button" className="primary-btn" onClick={handleCoachSubmit} disabled={isLoading} style={{ flex: 1, padding: '0.8125rem', background: '#2C2925', color: '#F7F5F2', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {isLoading ? 'Creating account…' : 'Create account'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#8C8680', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#5C5751', fontWeight: 500 }}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}