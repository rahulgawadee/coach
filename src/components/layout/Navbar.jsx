'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const Navbar = ({ role = 'candidate' }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const { logout, user } = useAuth();
  const router = useRouter();

  const candidateNavLinks = [
    { label: 'Home', href: '/' },
    { label: 'Opportunities', href: '/opportunities' },
    { label: 'Courses', href: '/courses' },
    { label: 'Mentorships', href: '/mentorships' },
    { label: 'Events', href: '/events' },
  ];

  const coachNavLinks = [
    { label: 'Home', href: '/' },
    { label: 'My Candidates', href: '/candidates' },
    { label: 'Schedule', href: '/schedule' },
    { label: 'Resources', href: '/resources' },
    { label: 'Analytics', href: '/analytics' },
  ];

  const navLinks = role === 'coach' ? coachNavLinks : candidateNavLinks;

  const notifications = [
    { id: 1, message: 'New mentorship request from John', time: '2 hours ago' },
    { id: 2, message: 'Course completed: Advanced React', time: '5 hours ago' },
    { id: 3, message: 'Upcoming event: Tech Talk Tomorrow', time: '1 day ago' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0">
            <div className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Coach
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <p className="text-sm text-gray-900">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="Switch language"
              >
                <span className="text-sm font-semibold">{language.toUpperCase()}</span>
              </button>
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <a
                    href="/dashboard"
                    className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    Profile
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        await logout();
                        router.push('/login');
                      } catch (err) {
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 transition-colors border-t border-gray-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  role: require('prop-types').oneOf(['candidate', 'coach']),
};

export default Navbar;

