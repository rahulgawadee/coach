'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = ({ role = 'candidate', minimal = false }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pathname = usePathname();
  // If explicitly minimal, hide links. Also check pathname as fallback.
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
  const getStartedHref = role === 'coach' ? '/signup?role=coach' : '/signup';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
        @keyframes shimmer-nav{0%{background-position:-200% center}100%{background-position:200% center}}
        .nav-link-item{
          font-family:'DM Sans',sans-serif;
          font-size:14px;font-weight:500;
          color:rgba(148,163,184,.8);
          text-decoration:none;
          transition:color .2s ease;
          white-space:nowrap;
        }
        .nav-link-item:hover{color:#f1f5f9}
        .nav-btn-ghost{
          font-family:'Syne',sans-serif;
          font-size:13px;font-weight:600;
          padding:9px 20px;border-radius:11px;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);
          color:#e2e8f0;cursor:pointer;
          transition:all .25s ease;
          backdrop-filter:blur(10px);
        }
        .nav-btn-ghost:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.22);transform:translateY(-1px)}
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
          font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;
          color:rgba(148,163,184,.85);text-decoration:none;
          border-radius:10px;transition:all .2s ease;
        }
        .mob-link:hover{color:#f1f5f9;background:rgba(255,255,255,.05)}
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 32px',
        background: scrolled
          ? 'rgba(8,8,15,0.85)'
          : 'rgba(8,8,15,0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.04)'}`,
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
            }}>Coach.</span>
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
          {!isAuthPage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }} className="nav-desktop">
              <Link href={signInHref} className="nav-btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                Sign in
              </Link>
              <Link href={getStartedHref} className="nav-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                Get started →
              </Link>
            </div>
          )}

          {/* Mobile burger - only if not minimal/auth page */}
          {!isAuthPage && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: 'none', padding: 8, background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(148,163,184,.8)', borderRadius: 8,
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
          <div style={{
            borderTop: '1px solid rgba(255,255,255,.06)',
            padding: '12px 0 20px',
            background: 'rgba(8,8,15,.95)',
          }}>
            {links.map(link => (
              <a key={link.label} href={link.href} className="mob-link"
                onClick={() => setMobileOpen(false)}>{link.label}</a>
            ))}
            <div style={{ display: 'flex', gap: 10, padding: '12px 20px 0' }}>
              <Link href={signInHref} className="nav-btn-ghost" style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
                Sign in
              </Link>
              <Link href={getStartedHref} className="nav-btn-primary" style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
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