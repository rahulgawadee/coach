'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  FolderOpen,
  Users,
  Building2,
  BarChart3,
  Bell,
  UserCircle,
  FileSignature,
  LogOut,
  ChevronLeft,
  Zap,
} from 'lucide-react';

const Sidebar = ({ role = 'candidate', isOpen = true, onToggle, onLogout }) => {
  const pathname = usePathname();
  const [messageCount, setMessageCount] = useState(0);
  const [hoveredItem, setHoveredItem] = useState(null);

  const userEmail = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = window.localStorage.getItem('user');
      if (!raw) return '';
      return JSON.parse(raw)?.email || '';
    } catch { return ''; }
  }, []);

  useEffect(() => {
    if (role !== 'candidate' || !userEmail) return;
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/candidate/messages?email=${encodeURIComponent(userEmail)}`);
        const payload = await res.json();
        if (!mounted || !payload?.success) return;
        const unread = (payload.data?.coachMessages || []).filter(m => !m.seen).length;
        setMessageCount(unread);
      } catch {}
    };
    load();
    const t = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(t); };
  }, [role, userEmail]);

  const candidateItems = [
    { label: 'Dashboard',    href: '/candidate/dashboard', icon: LayoutDashboard },
    { label: 'My Calendar',  href: '/candidate/calendar',  icon: CalendarDays },
    { label: 'Messages',     href: '/candidate/messages',  icon: MessageSquare, badge: messageCount },
    { label: 'Jobs',         href: '/candidate/jobs',      icon: Building2 },
    { label: 'My Documents', href: '/candidate/documents', icon: FolderOpen },
    { label: 'My Coach',     href: '/candidate/my-coach',  icon: UserCircle },
    { label: 'Agreement',    href: '/candidate/agreement', icon: FileSignature },
    { label: 'Profile',      href: '/candidate/profile',   icon: UserCircle },
  ];

  const coachItems = [
    { label: 'Dashboard',        href: '/coach/dashboard',    icon: LayoutDashboard },
    { label: 'My Candidates',    href: '/coach/candidates',   icon: Users },
    { label: 'Schedule Manager', href: '/coach/schedule',     icon: CalendarDays },
    { label: 'Messages',         href: '/coach/messages',     icon: MessageSquare },
    { label: 'Documents Hub',    href: '/coach/documents',    icon: FolderOpen },
    { label: 'Company Info',     href: '/coach/company-info', icon: Building2 },
    { label: 'Reports',          href: '/coach/reports',      icon: BarChart3 },
    { label: 'Notifications',    href: '/coach/notifications',icon: Bell },
    { label: 'Profile',          href: '/coach/profile',      icon: UserCircle },
  ];

  const items = role === 'coach' ? coachItems : candidateItems;
  const isActive = (href) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .sidebar-root {
          font-family: 'DM Sans', sans-serif;
          position: fixed; left: 0; top: 0; z-index: 110; height: 100vh;
          background: rgba(6,6,15,0.97);
          border-right: 1px solid rgba(255,255,255,0.055);
          backdrop-filter: blur(24px);
          transition: width 0.28s cubic-bezier(0.4,0,0.2,1);
          display: flex; flex-direction: column;
          overflow: visible;
        }
        .sidebar-root.open  { width: 256px; }
        .sidebar-root.closed{ width: 72px; }

        @media (max-width: 767px) {
          .sidebar-root {
            width: 256px !important;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 100;
          }
          .sidebar-root.open {
            transform: translateX(0);
            box-shadow: 20px 0 50px rgba(0,0,0,0.5);
          }
          .sidebar-root.closed {
            transform: translateX(-100%);
          }
          .sb-toggle {
            display: none;
          }
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            z-index: 95;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }
          .sidebar-overlay.visible {
            opacity: 1;
            pointer-events: auto;
          }
        }

        /* Inner grid line for depth */
        .sidebar-root::before {
          content:''; position:absolute; inset:0;
          background: linear-gradient(180deg, rgba(99,102,241,0.03) 0%, transparent 40%);
          pointer-events:none;
        }

        /* Logo area */
        .sb-logo {
          height: 68px;
          display: flex; align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 0 18px;
          gap: 12px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .sb-logo-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #4f46e5 0%, #0891b2 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(79,70,229,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .sb-logo-icon:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.45); }
        .sb-logo-text {
          font-family: 'DM Serif Display', Georgia, serif;
          font-style: italic;
          font-size: 20px;
          color: #fff;
          white-space: nowrap;
          opacity: 1;
          transition: opacity 0.2s, transform 0.2s;
          transform: translateX(0);
          display: inline-block;
        }
        .sidebar-root.closed .sb-logo-text {
          opacity: 0; transform: translateX(-8px); pointer-events: none; width: 0; overflow: hidden;
        }

        /* Toggle button */
        .sb-toggle {
          position: absolute; top: 21px; right: -13px;
          width: 26px; height: 26px; border-radius: 50%;
          background: #0f0e1c;
          border: 1px solid rgba(99,102,241,0.3);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 10;
          color: rgba(165,180,252,0.8);
          box-shadow: 0 2px 12px rgba(0,0,0,0.4);
          transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.3s;
        }
        .sb-toggle:hover { background:#1a1838; border-color:rgba(99,102,241,0.6); color:#a5b4fc; }
        .sb-toggle svg { transition: transform 0.28s cubic-bezier(0.4,0,0.2,1); }
        .sidebar-root.closed .sb-toggle svg { transform: rotate(180deg); }

        /* Nav */
        .sb-nav {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          padding: 16px 10px;
          display: flex; flex-direction: column; gap: 2px;
        }
        .sb-nav::-webkit-scrollbar { width: 3px; }
        .sb-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        /* Nav item */
        .sb-item {
          position: relative;
          display: flex; align-items: center; gap: 12px;
          padding: 10px 8px;
          border-radius: 12px;
          border: 1px solid transparent;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.18s, border-color 0.18s;
          color: rgba(148,163,184,0.8);
        }
        .sb-item:hover { background: rgba(255,255,255,0.04); color: #fff; }
        .sb-item.active {
          background: rgba(99,102,241,0.1);
          border-color: rgba(99,102,241,0.22);
          color: #a5b4fc;
          box-shadow: inset 0 0 0 0.5px rgba(99,102,241,0.15), 0 0 16px rgba(99,102,241,0.06);
        }

        /* Icon wrapper — this is what floats */
        .sb-icon {
          width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease, background 0.18s;
          position: relative;
        }
        .sb-item:hover .sb-icon {
          transform: translateY(-3px);
          background: rgba(99,102,241,0.1);
          box-shadow: 0 6px 16px rgba(99,102,241,0.18);
        }
        .sb-item.active .sb-icon {
          background: rgba(99,102,241,0.15);
        }
        .sb-item.active:hover .sb-icon {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.28);
        }

        /* Label */
        .sb-label {
          font-size: 13.5px; font-weight: 500; letter-spacing: 0.01em;
          opacity: 1; transform: translateX(0);
          transition: opacity 0.2s, transform 0.2s;
          flex: 1;
          white-space: nowrap;
        }
        .sidebar-root.closed .sb-label {
          opacity: 0; transform: translateX(-6px); pointer-events: none; width: 0; overflow: hidden; display: inline-block;
        }

        /* Badge */
        .sb-badge {
          margin-left: auto; flex-shrink: 0;
          min-width: 20px; height: 20px; padding: 0 6px;
          border-radius: 10px;
          background: #3b82f6;
          font-size: 10px; font-weight: 700; color: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 10px rgba(59,130,246,0.5);
          transition: opacity 0.2s;
        }
        .sidebar-root.closed .sb-badge {
          opacity: 0; width: 0; min-width: 0; padding: 0; overflow: hidden;
        }
        /* Collapsed badge dot */
        .sb-badge-dot {
          position: absolute; top: 4px; right: 4px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #3b82f6;
          border: 1.5px solid #06060f;
          box-shadow: 0 0 6px rgba(59,130,246,0.7);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .sidebar-root.closed .sb-badge-dot { opacity: 1; }

        /* Tooltip for collapsed mode */
        .sb-tooltip {
          position: absolute; left: calc(100% + 14px); top: 50%;
          transform: translateY(-50%) translateX(-4px);
          background: #1a1838;
          border: 1px solid rgba(99,102,241,0.25);
          color: #e0e7ff; font-size: 12px; font-weight: 500;
          padding: 6px 12px; border-radius: 8px; white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s, transform 0.15s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          z-index: 100;
        }
        .sidebar-root.closed .sb-item:hover .sb-tooltip { opacity: 1; transform: translateY(-50%) translateX(0); }

        /* Section divider */
        .sb-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 8px 4px; }

        /* Footer */
        .sb-footer {
          padding: 10px 10px 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          flex-shrink: 0;
        }
        .sb-logout {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 8px; border-radius: 12px;
          border: 1px solid transparent;
          cursor: pointer; width: 100%;
          color: rgba(148,163,184,0.7);
          background: none;
          transition: background 0.18s, border-color 0.18s, color 0.18s;
          white-space: nowrap;
        }
        .sb-logout:hover {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.15);
          color: #f87171;
        }
        .sb-logout:hover .sb-icon {
          transform: translateY(-3px);
          background: rgba(239,68,68,0.1);
          box-shadow: 0 6px 14px rgba(239,68,68,0.15);
        }

        /* Active left accent bar */
        .sb-item.active::before {
          content: '';
          position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 2.5px; border-radius: 2px;
          background: linear-gradient(180deg, #818cf8, #67e8f9);
          box-shadow: 0 0 8px rgba(129,140,248,0.6);
        }
      `}</style>

      {isOpen && (
        <div 
          className="sidebar-overlay visible lg:hidden" 
          onClick={onToggle}
        />
      )}
      <aside className={`sidebar-root ${isOpen ? 'open' : 'closed'}`}>
        {/* Toggle button — always visible, floats on the edge */}
        <button className="sb-toggle" onClick={onToggle} aria-label={isOpen ? 'Collapse' : 'Expand'}>
          <ChevronLeft size={13} strokeWidth={2.5} />
        </button>

        {/* Logo */}
        <div className="sb-logo">
          {userEmail && (
            <div className="sb-logo-icon" style={{ overflow: 'hidden' }}>
              {(() => {
                const raw = window.localStorage.getItem('user');
                const parsedUser = raw ? JSON.parse(raw) : null;
                if (parsedUser?.avatarUrl) {
                  return <img src={parsedUser.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                }
                return <Zap size={18} color="#fff" strokeWidth={2} fill="rgba(255,255,255,0.15)" />;
              })()}
            </div>
          )}
          {!userEmail && (
            <div className="sb-logo-icon">
              <Zap size={18} color="#fff" strokeWidth={2} fill="rgba(255,255,255,0.15)" />
            </div>
          )}
          <span className="sb-logo-text">Elevate</span>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          {items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`sb-item ${active ? 'active' : ''}`}
                onClick={() => {
                  if (window.innerWidth < 768) onToggle();
                }}
              >
                <div className="sb-icon">
                  <Icon
                    size={18}
                    strokeWidth={active ? 2 : 1.7}
                    color={active ? '#a5b4fc' : 'currentColor'}
                  />
                  {item.badge > 0 && <span className="sb-badge-dot" />}
                </div>

                <span className="sb-label">{item.label}</span>

                {item.badge > 0 && (
                  <span className="sb-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                )}

                {/* Tooltip shown only in collapsed mode */}
                <span className="sb-tooltip">
                  {item.label}
                  {item.badge > 0 && ` (${item.badge})`}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <button className="sb-logout" onClick={onLogout}>
            <div className="sb-icon">
              <LogOut size={17} strokeWidth={1.7} />
            </div>
            <span className="sb-label" style={{ fontSize: 13.5, fontWeight: 500 }}>Logout</span>
            <span className="sb-tooltip">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;