'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = ({ role = 'candidate', isOpen = true, onToggle, onLogout }) => {
  const pathname = usePathname();
  const [messageCount, setMessageCount] = useState(0);

  const userEmail = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = window.localStorage.getItem('user');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return parsed?.email || '';
    } catch {
      return '';
    }
  }, []);

  useEffect(() => {
    if (role !== 'candidate' || !userEmail) return;

    let mounted = true;
    const loadUnreadCount = async () => {
      try {
        const response = await fetch(
          `/api/candidate/messages?email=${encodeURIComponent(userEmail)}`
        );
        const payload = await response.json();
        if (!mounted || !payload?.success) return;

        const unread = (payload.data?.coachMessages || []).filter((item) => !item.seen).length;
        setMessageCount(unread);
      } catch {
        // Keep current badge on transient network errors.
      }
    };

    loadUnreadCount();
    const timer = setInterval(loadUnreadCount, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [role, userEmail]);

  const candidateMenuItems = [
    {
      label: 'Dashboard',
      href: '/candidate/dashboard',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
    },
    {
      label: 'My Calendar',
      href: '/candidate/calendar',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Messages',
      href: '/candidate/messages',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.348-3.595A7.2 7.2 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      badge: messageCount,
    },
    {
      label: 'My Documents',
      href: '/candidate/documents',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
      ),
    },
    {
      label: 'My Coach',
      href: '/candidate/my-coach',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Agreement',
      href: '/candidate/agreement',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 4h10l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h2z" />
        </svg>
      ),
    },
    {
      label: 'Profile',
      href: '/candidate/profile',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
    },
  ];

  const coachMenuItems = [
    { label: 'Dashboard', icon: '📊', href: '/coach/dashboard' },
    { label: 'My Candidates', icon: '👥', href: '/coach/candidates' },
    { label: 'Schedule Manager', icon: '📅', href: '/coach/schedule' },
    { label: 'Messages', icon: '💬', href: '/coach/messages' },
    { label: 'Documents Hub', icon: '📄', href: '/coach/documents' },
    { label: 'Company Info', icon: '🏢', href: '/coach/company-info' },
    { label: 'Reports', icon: '📈', href: '/coach/reports' },
    { label: 'Notifications', icon: '🔔', href: '/coach/notifications' },
    { label: 'Profile', icon: '👤', href: '/coach/profile' },
  ];

  const menuItems = role === 'coach' ? coachMenuItems : candidateMenuItems;

  const isActive = (href) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-screen bg-gray-950 text-gray-100 transition-all duration-300 ${
        isOpen ? 'w-[260px]' : 'w-20'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
          <p className={`text-sm font-semibold text-white ${isOpen ? 'block' : 'hidden md:block'}`}>
            Candidate Panel
          </p>
          <button
            type="button"
            onClick={onToggle}
            className="hidden rounded-md p-1 text-gray-300 hover:bg-gray-800 hover:text-white md:inline-flex"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg
              className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                title={!isOpen ? item.label : ''}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  {typeof item.icon === 'string' ? item.icon : item.icon}
                </span>
                {isOpen && <span className="truncate font-medium">{item.label}</span>}
                {isOpen && item.badge > 0 && (
                  <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-red-600 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1m0-10V7m0 0V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h5a2 2 0 002-2v-1" />
            </svg>
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  role: require('prop-types').oneOf(['candidate', 'coach']),
  isOpen: require('prop-types').bool,
  onToggle: require('prop-types').func,
  onLogout: require('prop-types').func,
};

export default Sidebar;

