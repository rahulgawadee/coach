'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const inputBase = {
  width: '100%',
  padding: '0.875rem 1rem',
  fontSize: '0.9375rem',
  border: '1px solid var(--card-border)',
  borderRadius: '12px',
  outline: 'none',
  background: 'var(--card-bg)',
  color: 'var(--text-primary)',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
};

function Field({ label, optional, textarea, rows = 4, ...props }) {
  const [focused, setFocused] = useState(false);
  const style = {
    ...inputBase,
    borderColor: focused ? 'var(--primary)' : 'var(--card-border)',
    background: focused ? 'var(--primary-glow)' : 'var(--card-bg)',
    boxShadow: focused ? '0 0 0 4px var(--primary-glow)' : 'none',
    ...(textarea ? { resize: 'vertical', lineHeight: 1.6 } : {}),
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', gap: '6px', alignItems: 'center' }}>
        {label}
        {optional && <span style={{ fontWeight: 400, color: 'var(--text-muted)', opacity: 0.5, fontSize: '0.75rem', textTransform: 'lowercase' }}>optional</span>}
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

const pts = Array.from({ length: 22 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  sz: Math.random() * 2.5 + 1, dur: Math.random() * 14 + 8,
  delay: Math.random() * 8, op: Math.random() * 0.3 + 0.07,
  c: i % 3 === 0 ? "56,189,248" : i % 3 === 1 ? "129,140,248" : "167,139,250",
}));

const Orb = ({ color, sz, style }) => (
  <div style={{ position:"absolute", width:sz, height:sz, borderRadius:"50%", background:color, filter:`blur(${sz*.22}px)`, pointerEvents:"none", ...style }} />
);

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState('candidate');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarBase64, setAvatarBase64] = useState(null);

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
    if (params.get('email')) setFormData(prev => ({ ...prev, email: params.get('email') }));
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

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed for avatars.');
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result);
    };
    reader.readAsDataURL(file);
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
      const result = await register(formData.email, formData.password, formData.confirmPassword, 'Candidate', formData.fullName, avatarBase64);
      if (!result.success) setError(result.error || 'Registration failed');
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
      const regResult = await register(formData.email, formData.password, formData.confirmPassword, 'Coach', formData.fullName, avatarBase64);
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
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'calc(62px + 2.5rem) 1rem 2.5rem',
      fontFamily: "'Syne', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      transition: 'background-color 0.4s ease'
    }}>
      <Orb color="radial-gradient(circle,#4f46e5,transparent)" sz={580} style={{ top:-110, left:-110, opacity:.22 }} />
      <Orb color="radial-gradient(circle,#0284c7,transparent)" sz={460} style={{ bottom:-60, right:-80, opacity:.18 }} />
      <Orb color="radial-gradient(circle,#7c3aed,transparent)" sz={260} style={{ top:"55%", left:"46%", opacity:.1 }} />
      {/* grid */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(var(--card-border) 0.5px,transparent 0.5px),linear-gradient(90deg,var(--card-border) 0.5px,transparent 0.5px)", backgroundSize:"56px 56px", opacity:0.1, pointerEvents:"none" }} />
      {/* particles */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        {mounted && pts.map(p => <div key={p.id} style={{ position:"absolute", left:`${p.x}%`, top:`${p.y}%`, width:p.sz, height:p.sz, borderRadius:"50%", background:`rgba(${p.c},${p.op})`, animation:`float ${p.dur}s ease-in-out ${p.delay}s infinite alternate` }} />)}
      </div>
      {/* rings */}
      <div style={{ position:"absolute", right:-30, top:"50%", transform:"translateY(-50%)", width:540, height:540, borderRadius:"50%", border:"1px solid rgba(99,102,241,.1)", animation:"spin 40s linear infinite", pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:22, left:"50%", width:9, height:9, borderRadius:"50%", background:"#6366f1", transform:"translateX(-50%)", boxShadow:"0 0 16px #6366f1" }} />
      </div>
      <div style={{ position:"absolute", right:80, top:"50%", transform:"translateY(-50%)", width:360, height:360, borderRadius:"50%", border:"1px solid rgba(56,189,248,.07)", animation:"spin 24s linear infinite reverse", pointerEvents:"none" }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes float{0%{transform:translateY(0) scale(1)}100%{transform:translateY(-20px) scale(1.07)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .glass-card {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 28px;
          box-shadow: var(--shadow-lg);
        }
        .primary-btn {
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px -5px var(--primary-glow);
        }
        .primary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px var(--primary-glow);
        }
        .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .secondary-btn {
          background: var(--card-bg);
          color: var(--text-primary);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .secondary-btn:hover:not(:disabled) { background: var(--primary-glow); }
        .role-btn {
          flex: 1;
          padding: 1.25rem 1rem;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }
        .role-btn.active {
          background: var(--primary-glow);
          border-color: var(--primary);
          box-shadow: 0 0 20px var(--primary-glow);
        }
        .expertise-chip {
          padding: 8px 16px;
          border-radius: 100px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          color: var(--text-muted);
        }
        .expertise-chip.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 5px 15px var(--primary-glow);
        }
        .step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--card-border);
          transition: all 0.3s ease;
        }
        .step-dot.active { background: var(--primary); box-shadow: 0 0 10px var(--primary); }
        .step-dot.completed { background: var(--primary); opacity: 0.6; }
        @media (max-width: 480px) {
          .glass-card { border-radius: 0; border-left: none; border-right: none; }
          h2 { font-size: 1.5rem !important; }
          div[style*="padding: 2.5rem"] { padding: 1.5rem !important; }
          .role-btn { padding: 1rem 0.75rem !important; }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: role === 'coach' ? '580px' : '460px', position: 'relative', zIndex: 1 }}>
        
        {/* Role Switcher */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '2rem' }}>
          {['candidate', 'coach'].map(r => (
            <button key={r} className={`role-btn ${role === r ? 'active' : ''}`} onClick={() => { setRole(r); setStep(1); }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: role === r ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '4px' }}>
                {r === 'candidate' ? 'Mentee' : 'Mentor'}
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</div>
            </button>
          ))}
        </div>

        <div className="glass-card">
          {/* Coach Step Indicators */}
          {role === 'coach' && (
            <div style={{ padding: '1.5rem 2.5rem 0', display: 'flex', gap: '8px', justifyContent: 'center' }}>
              {STEPS.map(s => (
                <div key={s.id} className={`step-dot ${step === s.id ? 'active' : step > s.id ? 'completed' : ''}`} />
              ))}
            </div>
          )}

          <div style={{ padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              {role === 'candidate' ? 'Create Account' : `Mentor Setup: ${STEPS[step-1].label}`}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '2rem', fontFamily: "'DM Sans', sans-serif" }}>
              {role === 'candidate' ? 'Join 50k+ professionals accelerating their careers.' : `Step ${step} of 6: ${STEPS[step-1].label} information.`}
            </p>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.875rem 1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#F87171', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            {role === 'candidate' ? (
              <form onSubmit={handleCandidateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>👤</span>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Profile Image (Optional)</label>
                    <input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }} disabled={isLoading} />
                  </div>
                </div>
                <Field label="Full Name" type="text" name="fullName" placeholder="Jane Doe" value={formData.fullName} onChange={handleChange} disabled={isLoading} required />
                <Field label="Email Address" type="email" name="email" placeholder="jane@example.com" value={formData.email} onChange={handleChange} disabled={isLoading} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="Password" type="password" name="password" placeholder="Min. 8" value={formData.password} onChange={handleChange} disabled={isLoading} required />
                  <Field label="Confirm" type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} required />
                </div>
                
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', marginTop: '0.5rem' }}>
                  <input type="checkbox" required style={{ marginTop: '4px' }} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    I agree to the <a href="#" style={{ color: 'var(--primary)' }}>Terms</a> and <a href="#" style={{ color: 'var(--primary)' }}>Privacy Policy</a>.
                  </span>
                </label>

                <button type="submit" className="primary-btn" disabled={isLoading} style={{ padding: '1.125rem', fontSize: '1rem', marginTop: '1rem' }}>
                  {isLoading ? 'Creating Account...' : 'Get Started for Free →'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>👤</span>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Profile Image (Optional)</label>
                        <input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }} disabled={isLoading} />
                      </div>
                    </div>
                    <Field label="Full Name" type="text" name="fullName" placeholder="Jane Doe" value={formData.fullName} onChange={handleChange} required />
                    <Field label="Email Address" type="email" name="email" placeholder="jane@example.com" value={formData.email} onChange={handleChange} required />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="Password" type="password" name="password" placeholder="Min. 8" value={formData.password} onChange={handleChange} required />
                      <Field label="Confirm" type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Field label="Company Name" type="text" name="companyName" placeholder="Techvance AB" value={formData.companyName} onChange={handleChange} required />
                    <Field label="Org Number" type="text" name="companyRegistrationNumber" placeholder="123456-7890" value={formData.companyRegistrationNumber} onChange={handleChange} required />
                    <Field label="Supplier ID" type="text" name="governmentAgencyId" placeholder="AF-999-XYZ" value={formData.governmentAgencyId} onChange={handleChange} required />
                  </div>
                )}

                {step === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Field label="Profile Bio" textarea name="bio" placeholder="Briefly describe your coaching style and background..." value={formData.bio} onChange={handleChange} required />
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>Areas of Expertise</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {EXPERTISE_AREAS.map(area => (
                          <div key={area} className={`expertise-chip ${formData.expertiseAreas.includes(area) ? 'active' : ''}`} onClick={() => toggleExpertise(area)}>{area}</div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="Experience (Years)" type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} required />
                      <Field label="Certifications" optional type="text" name="certifications" value={formData.certifications} onChange={handleChange} />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Field label="Mobile Number" type="tel" name="phoneNumber" placeholder="+46 08 123 45 67" value={formData.phoneNumber} onChange={handleChange} required />
                    <Field label="Alt. Contact Name" optional type="text" name="contactPersonName" value={formData.contactPersonName} onChange={handleChange} />
                  </div>
                )}

                {step === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Field label="Max Candidate Slots" type="number" name="maxCandidates" value={formData.maxCandidates} onChange={handleChange} min="5" max="50" required />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <Field label="Start Time" type="time" value={formData.preferredWorkingHours.startTime} onChange={e => setFormData(p => ({...p, preferredWorkingHours:{...p.preferredWorkingHours, startTime:e.target.value}}))} />
                      <Field label="End Time" type="time" value={formData.preferredWorkingHours.endTime} onChange={e => setFormData(p => ({...p, preferredWorkingHours:{...p.preferredWorkingHours, endTime:e.target.value}}))} />
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { key: 'agreeToTermsOfService', text: 'I agree to the terms of service' },
                      { key: 'confirmedRegisteredSupplier', text: 'I am a registered supplier with Arbetsförmedlingen' }
                    ].map(item => (
                      <label key={item.key} style={{ display: 'flex', gap: '12px', padding: '1.25rem', borderRadius: '16px', background: formData[item.key] ? 'var(--primary-glow)' : 'var(--card-bg)', border: `1px solid ${formData[item.key] ? 'var(--primary)' : 'var(--card-border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                        <input type="checkbox" name={item.key} checked={formData[item.key]} onChange={handleChange} style={{ marginTop: '3px' }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{item.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                  {step > 1 && (
                    <button className="secondary-btn" onClick={handleCoachBack} style={{ padding: '1rem 1.5rem' }}>Back</button>
                  )}
                  {step < 6 ? (
                    <button className="primary-btn" onClick={handleCoachNext} style={{ flex: 1, padding: '1rem' }}>Next Step →</button>
                  ) : (
                    <button className="primary-btn" onClick={handleCoachSubmit} style={{ flex: 1, padding: '1rem' }}>{isLoading ? 'Creating Account...' : 'Complete Registration'}</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2rem', fontFamily: "'DM Sans', sans-serif" }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Sign in here →
          </Link>
        </p>
      </div>
    </div>
  );
}