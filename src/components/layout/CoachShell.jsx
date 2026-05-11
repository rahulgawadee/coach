'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CoachSidebar from '@/components/layout/CoachSidebar';
import {
  Bell,
  ChevronDown,
  UserCircle,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';

function initialsFromName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'C';
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
}

export default function CoachShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => { 
    setIsMounted(true); 
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  const useShell = useMemo(() => {
    if (!pathname?.startsWith('/coach/')) return false;
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      const role = String(parsed?.role || parsed?.userType || '').toLowerCase();
      return role === 'coach' || parsed?.isCoach === true;
    } catch { return false; }
  }, [pathname, isMounted]);

  useEffect(() => {
    if (!useShell || !isMounted) return;
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    try { setUser(JSON.parse(stored)); } catch { setUser(null); }
  }, [useShell, router, isMounted]);

  // Notifications placeholder for coach
  const unread = 0;
  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Coach';
  const initials  = initialsFromName(user?.name || firstName);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    finally {
      ['user','token','coachProfile'].forEach(k => localStorage.removeItem(k));
      router.push('/login');
    }
  };

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
          color: rgba(14,165,233,0.8); margin-bottom: 2px;
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
          background: rgba(14,165,233,0.1);
          border-color: rgba(14,165,233,0.25);
          color: #bae6fd;
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
        .shell-avatar:hover { background: rgba(255,255,255,0.065); border-color: rgba(14,165,233,0.2); }
        .shell-avatar-circle {
          width: 30px; height: 30px; border-radius: 8px;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff;
          letter-spacing: 0.04em;
          box-shadow: 0 2px 10px rgba(2,132,199,0.3);
          flex-shrink: 0;
          overflow: hidden;
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
          box-shadow: 0 20px 50px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(14,165,233,0.1);
          overflow: hidden;
          animation: dropIn 0.15s ease;
          z-index: 99;
        }
        @keyframes dropIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

        .shell-dropdown-header {
          padding: 14px 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(14,165,233,0.05);
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

        /* Main content */
        .shell-content {
          min-height: calc(100vh - 68px);
          padding: ${pathname === '/coach/messages' ? '0' : '32px 32px 48px'};
          transition: margin-left 0.28s cubic-bezier(0.4,0,0.2,1);
          margin-left: 0 !important;
        }
        @media(min-width:768px){
          .shell-content {
            margin-left: var(--sidebar-width) !important;
          }
        }
        @media(max-width:767px){ .shell-content{ padding: ${pathname === '/coach/messages' ? '0' : '20px 16px 40px'}; } }
      `}</style>

      <div className="shell-root" style={{ '--sidebar-width': isSidebarOpen ? '256px' : '72px' }}>
        <CoachSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(p => !p)}
          onLogout={handleLogout}
        />

        <div
          className="shell-content"
        >
          {/* ── Sticky Header ───────────────────────────────────── */}
          <header className="shell-header" style={{ 
            left: 'auto',
            right: 0,
            width: '100%',
            position: 'fixed',
            top: 0,
            zIndex: 50
          }}>
            <style>{`
              @media(min-width:768px) {
                .shell-header { width: calc(100% - var(--sidebar-width)) !important; }
              }
            `}</style>
            <button className="shell-hamburger" onClick={() => setIsSidebarOpen(p => !p)} aria-label="Toggle sidebar">
              <Menu size={18} strokeWidth={1.8} />
            </button>

            <div className="shell-title">
              <span className="shell-title-label">Coach Portal</span>
              <span className="shell-title-name">{firstName}</span>
            </div>

            <div className="shell-actions">

              <div style={{ position:'relative' }} data-dropdown>
                <button
                  className="shell-icon-btn"
                  onClick={() => { setNotificationsOpen(p => !p); setProfileOpen(false); }}
                  aria-label="Notifications"
                >
                  <Bell size={17} strokeWidth={1.8} />
                  {unread > 0 && <span className="notif-dot">{unread > 9 ? '9+' : unread}</span>}
                </button>
              </div>

              <div style={{ position:'relative' }} data-dropdown>
                <button
                  className="shell-avatar"
                  onClick={() => { setProfileOpen(p => !p); setNotificationsOpen(false); }}
                  aria-label="Profile menu"
                >
                  <div className="shell-avatar-circle">
                    {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
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
                      <Link href="/coach/profile" className="shell-dropdown-item" onClick={() => setProfileOpen(false)}>
                        <UserCircle size={15} strokeWidth={1.7} />
                        Profile
                      </Link>
                      <Link href="/coach/profile" className="shell-dropdown-item" onClick={() => setProfileOpen(false)}>
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

          <div style={{ paddingTop: 68 }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}