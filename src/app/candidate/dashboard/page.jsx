'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch coach info
        const coachResponse = await fetch('/api/candidate/get-coach', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (coachResponse.ok) {
          const coachData = await coachResponse.json();
          setCoach(coachData.data || coachData.coach);
        }

        // Fetch calendar (next session)
        const calendarResponse = await fetch('/api/candidate/calendar', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          const sessions = calendarData.data || calendarData.sessions || [];
          if (sessions.length > 0) {
            setNextSession(sessions[0]);
          }
        }

        // Fetch notifications (unread messages count)
        const notificationsResponse = await fetch('/api/candidate/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json();
          const unread = notificationsData.data?.filter((n) => !n.read) || [];
          setUnreadMessages(unread.length);
        }

        // Fetch announcements
        const announcementsResponse = await fetch('/api/candidate/messages', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (announcementsResponse.ok) {
          const messagesData = await announcementsResponse.json();
          const msgs = messagesData.data?.filter((m) => m.isAnnouncement) || [];
          setAnnouncements(msgs.slice(0, 3));
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const isWithinOneHour = (sessionDate) => {
    if (!sessionDate) return false;
    const session = new Date(sessionDate);
    const now = new Date();
    const diff = (session.getTime() - now.getTime()) / (1000 * 60); // minutes
    return diff >= 0 && diff <= 60;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}! 👋
        </h1>
        <p className="text-blue-100 text-lg">
          You're on track with your career coaching journey. Great progress!
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Coach Info & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coach Card */}
        <Card className="md:col-span-2">
          <h2 className="text-xl font-bold mb-4">👨‍🏫 Your Coach</h2>
          {coach ? (
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">{coach.fullName || coach.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg">
                    ⭐ {coach.rating || 4.8} ({coach.reviewCount || 0} reviews)
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{coach.companyName}</p>
              </div>

              {coach.bio && (
                <p className="text-gray-600 text-sm italic">"{coach.bio}"</p>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Link href="/candidate/messages" className="flex-1">
                  <Button variant="outline" className="w-full">
                    💬 Message Coach
                  </Button>
                </Link>
                <Link href="/candidate/calendar" className="flex-1">
                  <Button variant="outline" className="w-full">
                    📅 Schedule Session
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Coach information will appear after acceptance.</p>
          )}
        </Card>

        {/* Progress & Stats */}
        <Card>
          <h3 className="text-lg font-bold mb-4">📊 Your Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Completion</span>
                <span className="text-2xl font-bold text-blue-600">5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sessions completed:</span>
                <span className="font-semibold">0 of 8</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Documents reviewed:</span>
                <span className="font-semibold">0 of 3</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Next Session & Messages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Session */}
        <Card>
          <h2 className="text-xl font-bold mb-4">📅 Next Session</h2>
          {nextSession ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">{nextSession.title || 'Welcome Session'}</p>
                <p className="text-gray-600 mt-1">
                  {nextSession.date || new Date(nextSession.start).toLocaleDateString()} at{' '}
                  {nextSession.time || new Date(nextSession.start).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {isWithinOneHour(nextSession.start) && (
                <Button variant="primary" className="w-full">
                  🎥 Join Session
                </Button>
              )}

              {!isWithinOneHour(nextSession.start) && (
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">No sessions scheduled yet.</p>
              <Link href="/candidate/calendar">
                <Button variant="outline" className="w-full">
                  📅 Request Session
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Messages */}
        <Card>
          <h2 className="text-xl font-bold mb-4">💬 Unread Messages</h2>
          <div className="space-y-4">
            <div>
              <p className="text-4xl font-bold text-blue-600">{unreadMessages}</p>
              <p className="text-gray-600 text-sm mt-1">unread message{unreadMessages !== 1 ? 's' : ''}</p>
            </div>

            <Link href="/candidate/messages">
              <Button variant="outline" className="w-full">
                Open Messages
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold mb-4">📢 Announcements from {coach?.fullName || 'Your Coach'}</h2>
          <div className="space-y-3">
            {announcements.map((announcement, index) => (
              <div key={index} className="pb-3 border-b last:border-b-0 last:pb-0">
                <p className="font-medium text-gray-900">• {announcement.subject || 'Update'}</p>
                <p className="text-sm text-gray-600 mt-1">{announcement.message || announcement.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <h2 className="text-xl font-bold mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/candidate/messages">
            <Button variant="outline" className="w-full text-center">
              <span className="text-lg">💬</span>
              <span className="block text-xs mt-1">Message</span>
            </Button>
          </Link>

          <Link href="/candidate/calendar">
            <Button variant="outline" className="w-full text-center">
              <span className="text-lg">📅</span>
              <span className="block text-xs mt-1">Session</span>
            </Button>
          </Link>

          <Link href="/candidate/documents">
            <Button variant="outline" className="w-full text-center">
              <span className="text-lg">📄</span>
              <span className="block text-xs mt-1">Documents</span>
            </Button>
          </Link>

          <Link href="/candidate/profile">
            <Button variant="outline" className="w-full text-center">
              <span className="text-lg">👤</span>
              <span className="block text-xs mt-1">Profile</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
