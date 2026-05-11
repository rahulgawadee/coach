'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CandidateSidebar from '@/components/layout/CandidateSidebar';
import {
  Bell,
  ChevronDown,
  UserCircle,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';

const ONBOARDING_ROUTES = new Set([
  '/candidate/step1',
  '/candidate/step2',
  '/candidate/step3',
  '/candidate/selection-pending',
  '/candidate/not-eligible',
  '/candidate/waiting-for-coach',
]);

const EXCLUDED_ROUTES = new Set([]);

function initialsFromName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'C';
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
}

export default function CandidateShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { setIsMounted(true); }, []);

  const useShell = useMemo(() => {
    if (!pathname?.startsWith('/candidate/')) return false;
    if (EXCLUDED_ROUTES.has(pathname)) return false;
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      const role = String(parsed?.role || parsed?.userType || '').toLowerCase();
      return role === 'candidate' || parsed?.isCandidate === true;
    } catch { return false; }
  }, [pathname, isMounted]);

  useEffect(() => {
    if (!useShell || !isMounted) return;
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    try { setUser(JSON.parse(stored)); } catch { setUser(null); }
  }, [useShell, router, isMounted]);

  useEffect(() => {
    if (!isMounted || !pathname?.startsWith('/candidate/') || useShell || EXCLUDED_ROUTES.has(pathname)) return;
    const stored = localStorage.getItem('user');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const role = String(parsed?.role || parsed?.userType || '').toLowerCase();
      if (role === 'candidate' || parsed?.isCandidate === true) router.replace('/candidate/step1');
    } catch {}
  }, [pathname, router, useShell, isMounted]);

  useEffect(() => {
    if (!useShell || !user?.email || !isMounted) return;
    let active = true;
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/candidate/notifications?email=${encodeURIComponent(user.email)}`);
        const payload = await res.json();
        if (!active || !payload?.success) return;
        setNotifications(payload.data || []);
      } catch {}
    };
    fetch_();
    const t = setInterval(fetch_, 30000);
    return () => { active = false; clearInterval(t); };
  }, [useShell, user?.email, isMounted]);

  const unread = notifications.filter(n => !n.read).length;
  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Candidate';
  const initials  = initialsFromName(user?.name || firstName);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    finally {
      ['user','token','candidateProfile'].forEach(k => localStorage.removeItem(k));
      router.push('/login');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!notificationsOpen && !profileOpen) return;
    const handler = (e) => {
      if (!e.target.closest('[data-dropdown]')) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notificationsOpen, profileOpen]);

  if (!isMounted) return <div style={{ minHeight:'100vh', background:'#06060f' }} />;
  if (!useShell)   return <div style={{ background:'#06060f', minHeight:'100vh', color:'#cbd5e1' }}>{children}</div>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .shell-root { font-family:'DM Sans',sans-serif; min-height:100vh; background:#06060f; color:#cbd5e1; }

        /* ── Header ── */
        .shell-header {
          position: sticky; top: 0; z-index: 40;
          background: rgba(6,6,15,0.85);
          border-bottom: 1px solid rgba(255,255,255,0.055);
          backdrop-filter: blur(20px);
          height: 68px;
          display: flex; align-items: center;
          padding: 0 28px;
          gap: 16px;
        }

        /* Mobile hamburger */
        .shell-hamburger {
          display: none;
          align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 9px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(203,213,225,0.8);
          cursor: pointer; transition: background 0.18s, color 0.18s;
          flex-shrink: 0;
        }
        .shell-hamburger:hover { background: rgba(255,255,255,0.08); color:#fff; }
        @media(max-width:767px){ .shell-hamburger{ display:flex; } }

        /* Page title area */
        .shell-title { flex:1; min-width:0; }
        .shell-title-label {
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(99,102,241,0.8); margin-bottom: 2px;
          display: block;
        }
        .shell-title-name {
          font-family: 'DM Serif Display', Georgia, serif;
          font-style: italic;
          font-size: 19px; color: #fff; line-height: 1.1;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* Right cluster */
        .shell-actions { display:flex; align-items:center; gap:10px; }

        /* Icon button base */
        .shell-icon-btn {
          position: relative;
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.075);
          display: flex; align-items: center; justify-content: center;
          color: rgba(148,163,184,0.9);
          cursor: pointer; transition: background 0.18s, border-color 0.18s, color 0.18s, transform 0.2s;
        }
        .shell-icon-btn:hover {
          background: rgba(99,102,241,0.1);
          border-color: rgba(99,102,241,0.25);
          color: #a5b4fc;
          transform: translateY(-1px);
        }
        .shell-icon-btn .notif-dot {
          position: absolute; top: -3px; right: -3px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #ef4444;
          border: 2px solid #06060f;
          font-size: 9px; font-weight: 700; color: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 8px rgba(239,68,68,0.5);
        }

        /* Avatar button */
        .shell-avatar {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 10px 4px 4px;
          border-radius: 12px;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.075);
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
        }
        .shell-avatar:hover { background: rgba(255,255,255,0.065); border-color: rgba(99,102,241,0.2); }
        .shell-avatar-circle {
          width: 30px; height: 30px; border-radius: 8px;
          background: linear-gradient(135deg, #4f46e5 0%, #0891b2 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff;
          letter-spacing: 0.04em;
          box-shadow: 0 2px 10px rgba(79,70,229,0.3);
          flex-shrink: 0;
        }
        .shell-avatar-name {
          font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.8);
          max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        @media(max-width:480px){ .shell-avatar-name{ display:none; } }

        /* Dropdown panel */
        .shell-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          min-width: 220px;
          background: #0d0c1e;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(99,102,241,0.1);
          overflow: hidden;
          animation: dropIn 0.15s ease;
          z-index: 99;
        }
        @keyframes dropIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

        .shell-dropdown-header {
          padding: 14px 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(99,102,241,0.05);
        }
        .shell-dropdown-body { padding: 6px; }

        .shell-dropdown-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 10px;
          font-size: 13px; font-weight: 500;
          color: rgba(203,213,225,0.8);
          cursor: pointer; text-decoration: none;
          transition: background 0.15s, color 0.15s;
          width: 100%; border: none; background: none; text-align: left;
        }
        .shell-dropdown-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .shell-dropdown-item.danger { color: rgba(248,113,113,0.8); }
        .shell-dropdown-item.danger:hover { background: rgba(239,68,68,0.08); color: #f87171; }

        .shell-dropdown-sep { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 8px; }

        /* Notif items */
        .notif-item {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s; cursor: pointer;
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: rgba(255,255,255,0.03); }
        .notif-item-title { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.85); }
        .notif-item-msg   { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 3px; font-weight:300; }

        /* Main content */
        .shell-content {
          min-height: calc(100vh - 68px);
          padding: ${pathname === '/candidate/messages' ? '0' : '32px 32px 48px'};
          transition: margin-left 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        @media(max-width:767px){ .shell-content{ padding: ${pathname === '/candidate/messages' ? '0' : '20px 16px 40px'}; margin-left:0 !important; } }

        /* Skeleton for onboarding */
        .skel { background: rgba(255,255,255,0.04); border-radius:16px; animation:shimmer 1.8s infinite; }
        @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
      `}</style>

      <div className="shell-root">
        <CandidateSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(p => !p)}
          onLogout={handleLogout}
        />

        <div
          className="shell-content"
          style={{ marginLeft: isSidebarOpen ? 256 : 72 }}
        >
          {/* ── Sticky Header ───────────────────────────────────── */}
          <header className="shell-header" style={{ marginLeft: isSidebarOpen ? 256 : 72, width: `calc(100% - ${isSidebarOpen ? 256 : 72}px)`, position:'fixed', top:0, left:0 }}>
            {/* Mobile hamburger */}
            <button className="shell-hamburger" onClick={() => setIsSidebarOpen(p => !p)} aria-label="Toggle sidebar">
              <Menu size={18} strokeWidth={1.8} />
            </button>

            {/* Title */}
            <div className="shell-title">
              <span className="shell-title-label">Candidate Portal</span>
              <span className="shell-title-name">{firstName}</span>
            </div>

            {/* Actions */}
            <div className="shell-actions">

              {/* Notifications */}
              <div style={{ position:'relative' }} data-dropdown>
                <button
                  className="shell-icon-btn"
                  onClick={() => { setNotificationsOpen(p => !p); setProfileOpen(false); }}
                  aria-label="Notifications"
                >
                  <Bell size={17} strokeWidth={1.8} />
                  {unread > 0 && (
                    <span className="notif-dot">{unread > 9 ? '9+' : unread}</span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="shell-dropdown" style={{ minWidth:300 }}>
                    <div className="shell-dropdown-header">
                      <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.9)', margin:0 }}>Notifications</p>
                      {unread > 0 && <p style={{ fontSize:11, color:'rgba(99,102,241,0.8)', margin:'2px 0 0', fontWeight:500 }}>{unread} unread</p>}
                    </div>
                    <div style={{ maxHeight:280, overflowY:'auto' }}>
                      {notifications.length ? (
                        notifications.slice(0, 6).map(n => (
                          <div key={n.id} className="notif-item">
                            <p className="notif-item-title">{n.title || 'Update'}</p>
                            <p className="notif-item-msg">{n.message || 'You have a new notification.'}</p>
                          </div>
                        ))
                      ) : (
                        <p style={{ padding:'24px 16px', textAlign:'center', fontSize:13, color:'rgba(255,255,255,0.25)', fontWeight:300 }}>
                          No notifications yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div style={{ position:'relative' }} data-dropdown>
                <button
                  className="shell-avatar"
                  onClick={() => { setProfileOpen(p => !p); setNotificationsOpen(false); }}
                  aria-label="Profile menu"
                >
                  <div className="shell-avatar-circle">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      initials
                    )}
                  </div>
                  <span className="shell-avatar-name">{firstName}</span>
                  <ChevronDown
                    size={13} strokeWidth={2.5}
                    style={{ color:'rgba(148,163,184,0.5)', flexShrink:0, transform: profileOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}
                  />
                </button>

                {profileOpen && (
                  <div className="shell-dropdown">
                    <div className="shell-dropdown-header">
                      <p style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.9)', margin:0 }}>{user?.name || firstName}</p>
                      <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:'2px 0 0', fontWeight:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email || ''}</p>
                    </div>
                    <div className="shell-dropdown-body">
                      <Link href="/candidate/profile" className="shell-dropdown-item" onClick={() => setProfileOpen(false)}>
                        <UserCircle size={15} strokeWidth={1.7} />
                        Profile
                      </Link>
                      <Link href="/candidate/profile" className="shell-dropdown-item" onClick={() => setProfileOpen(false)}>
                        <Settings size={15} strokeWidth={1.7} />
                        Settings
                      </Link>
                      <div className="shell-dropdown-sep" />
                      <button className="shell-dropdown-item danger" onClick={handleLogout}>
                        <LogOut size={15} strokeWidth={1.7} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </header>

          {/* ── Page content (push down by header height) ───────── */}
          <div style={{ paddingTop: 68 }}>
            {ONBOARDING_ROUTES.has(pathname) && (
              <div style={{ opacity:.18, pointerEvents:'none', userSelect:'none', display:'flex', flexDirection:'column', gap:20, marginBottom:32 }}>
                <div className="skel" style={{ height:160, width:'100%' }} />
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
                  <div className="skel" style={{ height:220 }} />
                  <div className="skel" style={{ height:220 }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                  <div className="skel" style={{ height:160 }} />
                  <div className="skel" style={{ height:160 }} />
                </div>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </>
  );
}