'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
};

function Field({ label, hint, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#5C5751', letterSpacing: '0.01em' }}>
        {label}
      </label>
      <input
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputBase,
          borderColor: focused ? '#B8A99A' : '#E2DDD8',
          boxShadow: focused ? '0 0 0 3px rgba(184,169,154,0.18)' : 'none',
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [activeRole, setActiveRole] = useState('candidate');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
      background: '#F7F5F2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #BDB8B2; }
        .role-btn { cursor: pointer; border: none; background: transparent; transition: all 0.18s; }
        .role-btn:hover { background: rgba(255,255,255,0.7) !important; }
        .submit-btn:hover:not(:disabled) { background: #1A1916 !important; }
        .submit-btn:active:not(:disabled) { transform: scale(0.985); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .forgot-link:hover { color: #1A1916 !important; }
        .signup-link:hover { color: #1A1916 !important; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '420px' }}>

        

        {/* Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E8E4E0',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)',
        }}>

          {/* Role switcher */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid #E8E4E0',
          }}>
            {['candidate', 'coach'].map((role) => {
              const active = activeRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  className="role-btn"
                  onClick={() => setActiveRole(role)}
                  style={{
                    padding: '0.9rem',
                    fontSize: '0.8125rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#1A1916' : '#9C9690',
                    background: active ? '#FFFFFF' : '#F7F5F2',
                    borderRight: role === 'candidate' ? '1px solid #E8E4E0' : 'none',
                    borderBottom: active ? '2px solid #1A1916' : '2px solid transparent',
                    letterSpacing: '0.01em',
                    fontFamily: 'inherit',
                    transition: 'all 0.18s',
                  }}
                >
                  {role === 'candidate' ? 'Candidate' : 'Coach'}
                </button>
              );
            })}
          </div>

          {/* Form body */}
          <div style={{ padding: '2rem' }}>

            {/* Context hint */}
            <div style={{
              background: '#F7F5F2',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              borderLeft: '3px solid #C9BFB5',
            }}>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6B6560', lineHeight: 1.5 }}>
                {isCandidate
                  ? 'Continue your onboarding or access your candidate dashboard.'
                  : 'Access your coaching dashboard and manage your candidates.'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '10px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
              }}>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#B91C1C' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <Field
                label="Email address"
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

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-0.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    style={{ width: '15px', height: '15px', accentColor: '#1A1916', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.8125rem', color: '#6B6560' }}>Remember me</span>
                </label>
                <a
                  href="#"
                  className="forgot-link"
                  style={{ fontSize: '0.8125rem', color: '#8C8680', textDecoration: 'none', transition: 'color 0.15s' }}
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={isLoading}
                style={{
                  marginTop: '0.5rem',
                  width: '100%',
                  padding: '0.8125rem',
                  background: '#2C2925',
                  color: '#F7F5F2',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s, transform 0.1s',
                }}
              >
                {isLoading ? 'Signing in…' : `Sign in as ${isCandidate ? 'Candidate' : 'Coach'}`}
              </button>
            </form>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#8C8680', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="signup-link"
            style={{ color: '#5C5751', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}
          >
            Sign up →
          </Link>
        </p>
      </div>
    </div>
  );
}