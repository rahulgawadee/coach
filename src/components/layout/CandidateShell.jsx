'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CandidateSidebar from '@/components/layout/CandidateSidebar';

const EXCLUDED_ROUTES = new Set([
  '/candidate/step1',
  '/candidate/step2',
  '/candidate/step3',
  '/candidate/selection-pending',
  '/candidate/not-eligible',
  '/candidate/waiting-for-coach',
]);

function initialsFromName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'C';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
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

  // Set mounted state to true on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const useShell = useMemo(() => {
    // Only determine shell visibility on the client side
    if (!isMounted) return false;
    if (!pathname?.startsWith('/candidate/') || EXCLUDED_ROUTES.has(pathname)) return false;
    
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      const normalizedRole = String(parsed?.role || parsed?.userType || '').toLowerCase();
      // Render candidate shell only for candidate users
      return normalizedRole === 'candidate' || parsed?.isCandidate === true;
    } catch {
      return false;
    }
  }, [pathname, isMounted]);

  useEffect(() => {
    if (!useShell || !isMounted) return;
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      setUser(null);
    }
  }, [useShell, router, isMounted]);

  useEffect(() => {
    // Only redirect to step1 if we are on a candidate route that SHOULD have a shell
    // but the shell is inactive for some reason (e.g. role mismatch or missing data)
    // AND we are not already on an excluded (onboarding) route.
    if (!isMounted || !pathname?.startsWith('/candidate/') || useShell || EXCLUDED_ROUTES.has(pathname)) return;

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    try {
      const parsed = JSON.parse(storedUser);
      const normalizedRole = String(parsed?.role || parsed?.userType || '').toLowerCase();
      if (normalizedRole === 'candidate' || parsed?.isCandidate === true) {
        // Only redirect if we're not already on the onboarding flow
        router.replace('/candidate/step1');
      }
    } catch {
      // Ignore parse errors
    }
  }, [pathname, router, useShell, isMounted]);

  useEffect(() => {
    if (!useShell || !user?.email || !isMounted) return;

    let active = true;
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          `/api/candidate/notifications?email=${encodeURIComponent(user.email)}`
        );
        const payload = await response.json();
        if (!active || !payload?.success) return;
        setNotifications(payload.data || []);
      } catch {
        // Non-blocking refresh for header notifications.
      }
    };

    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [useShell, user?.email, isMounted]);

  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Candidate';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Local cleanup still logs user out.
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('candidateProfile');
      router.push('/login');
    }
  };

  // If not mounted yet, render a plain container to avoid mismatch
  if (!isMounted) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  if (!useShell) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CandidateSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        onLogout={handleLogout}
      />

      <div className={`min-h-screen transition-all duration-300 ${isSidebarOpen ? 'md:ml-[260px]' : 'md:ml-20'}`}>
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 md:hidden"
                aria-label="Toggle sidebar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <p className="text-sm text-gray-500">Welcome</p>
                <h1 className="text-lg font-semibold text-gray-900">{firstName}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((prev) => !prev);
                    setProfileOpen(false);
                  }}
                  className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100"
                  aria-label="Notifications"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-200 px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length ? (
                        notifications.slice(0, 6).map((item) => (
                          <div key={item.id} className="border-b border-gray-100 px-4 py-3 last:border-b-0">
                            <p className="text-sm font-medium text-gray-900">{item.title || 'Update'}</p>
                            <p className="mt-1 text-xs text-gray-600">{item.message || 'You have a new notification.'}</p>
                          </div>
                        ))
                      ) : (
                        <p className="px-4 py-5 text-sm text-gray-500">No notifications yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((prev) => !prev);
                    setNotificationsOpen(false);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white"
                  aria-label="Profile menu"
                >
                  {initialsFromName(user?.name || firstName)}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    <Link href="/candidate/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Profile
                    </Link>
                    <Link href="/candidate/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
