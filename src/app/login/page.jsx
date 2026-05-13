'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

function Field({ label, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputBase,
          borderColor: focused ? 'var(--primary)' : 'var(--card-border)',
          background: focused ? 'var(--primary-glow)' : 'var(--card-bg)',
          boxShadow: focused ? '0 0 0 4px var(--primary-glow)' : 'none',
        }}
      />
    </div>
  );
}

const pts = Array.from({ length: 22 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  sz: Math.random() * 2.5 + 1, dur: Math.random() * 14 + 8,
  delay: Math.random() * 8, op: Math.random() * 0.3 + 0.07,
  c: i % 3 === 0 ? "56,189,248" : i % 3 === 1 ? "129,140,248" : "167,139,250",
}));

const Orb = ({ color, sz, style }) => (
  <div style={{ position:"absolute", width:sz, height:sz, borderRadius:"50%", background:color, filter:`blur(${sz*.22}px)`, pointerEvents:"none", ...style }} />
);

export default function LoginPage() {
  const { login } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [activeRole, setActiveRole] = useState('candidate');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) setError(result.error || 'Login failed');
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const isCandidate = activeRole === 'candidate';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'calc(62px + 2rem) 1rem 2rem',
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
          border-radius: 24px;
          box-shadow: var(--shadow-lg);
        }
        .submit-btn {
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px -5px var(--primary-glow);
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.6);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .role-tab {
          flex: 1;
          padding: 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-muted);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        }
        .role-tab.active {
          color: var(--text-primary);
          border-bottom-color: var(--primary);
          background: var(--primary-glow);
        }
        @media (max-width: 480px) {
          .glass-card { border-radius: 0; border-left: none; border-right: none; }
          h1 { font-size: 1.75rem !important; }
          div[style*="padding: 2.5rem"] { padding: 1.5rem !important; }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        <div className="glass-card overflow-hidden">
          {/* Header */}
          <div style={{ padding: '2.5rem 2.5rem 1.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Welcome Back</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9375rem', fontFamily: "'DM Sans', sans-serif" }}>
              Sign in to your Elevate account to continue.
            </p>
          </div>

          {/* Role Switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)' }}>
            <button className={`role-tab ${isCandidate ? 'active' : ''}`} onClick={() => setActiveRole('candidate')}>Candidate</button>
            <button className={`role-tab ${!isCandidate ? 'active' : ''}`} onClick={() => setActiveRole('coach')}>Coach</button>
          </div>

          {/* Form */}
          <div style={{ padding: '2.5rem' }}>
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#F87171', fontWeight: 500 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Field
                label="Email Address"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />

              <Field
                label="Password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem' }}>
                <a href="#" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Forgot password?</a>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
                style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  fontSize: '1rem'
                }}
              >
                {isLoading ? 'Processing...' : `Sign in as ${isCandidate ? 'Candidate' : 'Coach'}`}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '2rem', fontFamily: "'DM Sans', sans-serif" }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            Create one for free →
          </Link>
        </p>
      </div>
    </div>
  );
}