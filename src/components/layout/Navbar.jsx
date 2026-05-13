'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const Navbar = ({ role = 'candidate', minimal = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pathname = usePathname();
  // If explicitly minimal, hide links. Also check pathname as fallback.
  const { theme, toggleTheme } = useTheme();
  const isAuthPage = minimal || ['/login', '/signup', '/coach/login'].includes(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Home',         href: '/#top' },
    { label: 'About',        href: '/#about' },
    { label: 'Mentees',      href: '/#mentees' },
    { label: 'Mentors',      href: '/#mentors' },
    { label: 'How it Works', href: '/#how-it-works' },
    { label: 'FAQ',          href: '/#faq' },
    { label: 'Contact',      href: '/#contact' },
  ];

  const signInHref = role === 'coach' ? '/coach/login' : '/login';
  const getStartedHref = role === 'coach' ? '/coach/login' : '/login';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes shimmer-nav{0%{background-position:-200% center}100%{background-position:200% center}}
        .nav-link-item{
          font-family:'DM Sans',sans-serif;
          font-size:14px;font-weight:500;
          color:var(--text-secondary);
          text-decoration:none;
          transition:color .2s ease;
          white-space:nowrap;
        }
        .nav-link-item:hover{color:var(--text-primary)}
        .nav-btn-ghost{
          font-family:'Syne',sans-serif;
          font-size:13px;font-weight:600;
          padding:9px 20px;border-radius:11px;
          background:var(--card-bg);
          border:1px solid var(--card-border);
          color:var(--text-primary);cursor:pointer;
          transition:all .25s ease;
          backdrop-filter:blur(10px);
        }
        .nav-btn-ghost:hover{background:var(--primary-glow);border-color:var(--primary);transform:translateY(-1px)}
        .nav-btn-primary{
          font-family:'Syne',sans-serif;
          font-size:13px;font-weight:700;
          padding:9px 20px;border-radius:11px;
          background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#6366f1 100%);
          background-size:200% auto;
          animation:shimmer-nav 3.5s linear infinite;
          border:none;color:#fff;cursor:pointer;
          transition:transform .25s ease,box-shadow .25s ease;
          box-shadow:0 0 22px rgba(99,102,241,.35),0 4px 12px rgba(99,102,241,.22);
          letter-spacing:.02em;
        }
        .nav-btn-primary:hover{transform:translateY(-1px) scale(1.03);box-shadow:0 0 36px rgba(99,102,241,.55),0 6px 18px rgba(99,102,241,.38)}
        .mob-link{
          display:block;padding:12px 20px;
          font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;
          color:var(--text-secondary);text-decoration:none;
          border-radius:12px;transition:all .2s ease;
        }
        .mob-link:hover{color:var(--text-primary);background:var(--primary-glow);transform:translateX(4px)}
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mobile-drawer {
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 32px',
        background: scrolled
          ? 'var(--header-bg)'
          : 'transparent',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid var(--glass-border)`,
        transition: 'all .35s ease',
      }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

          {/* Logo */}
          <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22,
              background: 'linear-gradient(135deg,#38bdf8,#818cf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>Elevate.</span>
          </a>

          {/* Desktop links */}
          {!isAuthPage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 30, flex: 1, justifyContent: 'center' }}
              className="nav-desktop">
              {links.map(link => (
                <a key={link.label} href={link.href} className="nav-link-item">{link.label}</a>
              ))}
            </div>
          )}

          {/* Desktop CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            
            {/* Theme Toggle - Always visible */}
            <button 
              onClick={toggleTheme}
              style={{
                width: 38, height: 38, borderRadius: 11,
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s ease',
                marginRight: 8, color: theme === 'dark' ? '#818cf8' : '#f59e0b'
              }}
              className="hover:scale-105"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {!isAuthPage && (
              <>
                <Link href={signInHref} className="nav-btn-ghost nav-desktop" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  Sign in
                </Link>
                <Link href={getStartedHref} className="nav-btn-primary nav-desktop" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  Get started →
                </Link>
              </>
            )}
          </div>

          {/* Mobile burger - only if not minimal/auth page */}
          {!isAuthPage && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: 'none', padding: 8, background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', borderRadius: 8,
                transition: 'color .2s',
              }}
              className="nav-mobile-btn"
              aria-label="Toggle menu"
            >
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                {mobileOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></>
                }
              </svg>
            </button>
          )}
        </div>

        {/* Mobile drawer */}
        {!isAuthPage && mobileOpen && (
          <div className="mobile-drawer" style={{
            borderTop: '1px solid var(--glass-border)',
            padding: '20px',
            background: 'var(--background)',
            backdropFilter: 'blur(30px)',
            position: 'absolute', top: '100%', left: 0, right: 0,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            {links.map(link => (
              <a key={link.label} href={link.href} className="mob-link"
                onClick={() => setMobileOpen(false)}>{link.label}</a>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
              <Link href={signInHref} className="nav-btn-ghost" style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px' }} onClick={() => setMobileOpen(false)}>
                Sign in
              </Link>
              <Link href={getStartedHref} className="nav-btn-primary" style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '14px' }} onClick={() => setMobileOpen(false)}>
                Get started →
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 860px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;