'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import { useAuth } from '@/context/AuthContext';

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-5">
      <div className="h-4 w-24 rounded bg-gray-200" />
      <div className="mt-3 h-6 w-36 rounded bg-gray-200" />
      <div className="mt-4 h-9 w-full rounded bg-gray-100" />
    </div>
  );
}

export default function CandidateDashboardHomePage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return;

    try {
      const parsed = JSON.parse(rawUser);
      if (parsed?.email) setEmail(parsed.email);
    } catch {
      setEmail('');
    }
  }, []);

  useEffect(() => {
    if (!email) return;

    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [dashboardRes, messagesRes, docsRes] = await Promise.all([
          fetch(`/api/candidate/dashboard?email=${encodeURIComponent(email)}`),
          fetch(`/api/candidate/messages?email=${encodeURIComponent(email)}`),
          fetch(`/api/candidate/documents?email=${encodeURIComponent(email)}`),
        ]);

        const dashboardData = await dashboardRes.json();
        const messagesData = await messagesRes.json();
        const docsData = await docsRes.json();

        if (!active) return;

        if (dashboardData?.success) {
          setDashboard(dashboardData.data);
        }

        if (messagesData?.success) {
          setMessages(messagesData.data?.coachMessages || []);
        }

        if (docsData?.success) {
          setDocuments(docsData.data || []);
        }

        const eligibilityRes = await fetch('/api/candidate/eligibility-check', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        const eligibilityData = await eligibilityRes.json();
        if (eligibilityRes.ok && eligibilityData?.data) {
          setEligibility(eligibilityData.data);
        } else {
          setEligibility(null);
        }
      } catch {
        // Keep stable UI with fallbacks.
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
  }, [email]);

  const upcomingSchedule = useMemo(() => {
    const events = dashboard?.upcomingEvents || [];
    return events.slice(0, 3);
  }, [dashboard?.upcomingEvents]);

  const recentMessages = useMemo(() => {
    return [...messages]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 2);
  }, [messages]);

  const pendingDocuments = useMemo(() => {
    return documents
      .filter((doc) => doc.folder === 'coach-shared' || doc.folder === 'message-docs')
      .slice(0, 4);
  }, [documents]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const coachName = dashboard?.coach?.name || 'Your Coach';
  const coachRating = dashboard?.coach?.rating || 4.8;
  const nextSession = (dashboard?.upcomingEvents || [])[0] || null;
  const isNotEligible = user?.onboardingStep === -1 || eligibility?.eligibilityStatus === 'not-eligible';

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-9">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm font-semibold text-gray-500">Eligibility Status</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {eligibility?.eligibilityStatus || (user?.onboardingStep === -1 ? 'Not eligible' : 'Not checked')}
            </p>
            {isNotEligible ? (
              <Link href="/candidate/step1" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
                Check Eligibility Again
              </Link>
            ) : (
              <p className="mt-4 text-sm text-gray-600">Eligibility check is complete.</p>
            )}
          </Card>

          <Card>
            <p className="text-sm font-semibold text-gray-500">Swedish Agency</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">Arbetsförmedlingen</p>
            <a href="mailto:arbetsformedlingen@arbetsformedlingen.se" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
              Email Agency
            </a>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-gray-500">Current Step</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{user?.onboardingStep ?? 0}</p>
            <p className="mt-4 text-sm text-gray-600">Your onboarding progress</p>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-gray-500">Next Action</p>
            <Link href={isNotEligible ? '/candidate/step1' : '/candidate/step3'} className="mt-2 inline-block text-lg font-semibold text-blue-600 hover:text-blue-700">
              {isNotEligible ? 'Recheck Eligibility' : 'Continue Onboarding'}
            </Link>
          </Card>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm font-semibold text-gray-500">Your Coach</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{coachName}</p>
            <p className="mt-1 text-sm text-amber-600">{'★'.repeat(Math.round(coachRating))} {coachRating}</p>
            <Link href="/candidate/messages" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
              Message Coach
            </Link>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-gray-500">Next Session</p>
            {nextSession ? (
              <>
                <p className="mt-2 text-sm font-semibold text-gray-900">{nextSession.title || 'Career Coaching Session'}</p>
                <p className="mt-1 text-sm text-gray-600">{nextSession.date || nextSession.start || 'Date pending'} · {nextSession.time || 'Time pending'}</p>
                {nextSession.virtualLink ? (
                  <a href={nextSession.virtualLink} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Join Session
                  </a>
                ) : (
                  <Link href="/candidate/calendar" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
                    View Calendar
                  </Link>
                )}
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-gray-600">No sessions scheduled</p>
                <Link href="/candidate/calendar" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Request Session
                </Link>
              </>
            )}
          </Card>

          <Card>
            <p className="text-sm font-semibold text-gray-500">Unread Messages</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{dashboard?.unreadMessages || 0}</p>
            <Link href="/candidate/messages" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
              Open Messages
            </Link>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-gray-500">Progress</p>
            <div className="mt-3">
              <ProgressBar progress={dashboard?.completionPercent || 0} showLabel={false} />
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-900">{dashboard?.completionPercent || 0}% complete</p>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card header="Upcoming Schedule">
            {upcomingSchedule.length ? (
              <div className="space-y-3">
                {upcomingSchedule.map((event) => (
                  <div key={event.id || `${event.title}-${event.start || event.date}`} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-semibold text-gray-900">{event.title || 'Session'}</p>
                    <p className="mt-1 text-xs text-gray-600">{event.date || event.start || 'Date'} · {event.time || event.type || 'Session'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-600">
                No sessions scheduled.
                <div className="mt-3">
                  <Link href="/candidate/calendar" className="font-semibold text-blue-600 hover:text-blue-700">
                    Request New Session
                  </Link>
                </div>
              </div>
            )}
          </Card>

          <Card header="Recent Messages">
            {recentMessages.length ? (
              <div className="space-y-3">
                {recentMessages.map((message, idx) => (
                  <div key={`${message.createdAt || idx}`} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Coach</p>
                    <p className="mt-1 text-sm text-gray-900">{message.text || 'No content'}</p>
                    <p className="mt-1 text-xs text-gray-500">{message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Just now'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No recent messages.</p>
            )}
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card header="Announcements">
            {(dashboard?.announcements || []).length ? (
              <div className="space-y-3">
                {dashboard.announcements.map((item) => (
                  <div key={item.id || item.title} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm font-semibold text-gray-900">{item.title || 'Announcement'}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.date ? new Date(item.date).toLocaleDateString() : 'Today'}</p>
                    <p className="mt-2 text-sm text-gray-700">{item.message || item.excerpt || 'No details provided.'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No announcements available.</p>
            )}
          </Card>

          <Card header="Documents Pending">
            {pendingDocuments.length ? (
              <div className="space-y-3">
                {pendingDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{doc.fileName}</p>
                      <p className="text-xs text-gray-500">Requested by coach</p>
                    </div>
                    <Link href="/candidate/documents" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                      Upload
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No pending document requests.</p>
            )}
          </Card>
        </section>
      </div>

      <aside className="hidden space-y-4 xl:col-span-3 xl:block">
        <Card header="Quick Actions">
          <div className="space-y-2">
            <Link href="/candidate/messages" className="block rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
              Message Coach
            </Link>
            <Link href="/candidate/calendar" className="block rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
              Request Session
            </Link>
            <Link href="/candidate/documents" className="block rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">
              Upload Document
            </Link>
          </div>
        </Card>

        <Card header="Your Stats">
          <div className="space-y-3 text-sm text-gray-700">
            <p>Sessions attended: {(dashboard?.upcomingEvents || []).length}</p>
            <p>Documents submitted: {documents.filter((doc) => doc.folder === 'my-uploads').length}</p>
            <p>Tasks completed: {Math.max(1, Math.round((dashboard?.completionPercent || 0) / 25))}</p>
          </div>
          <div className="mt-4">
            <Button size="sm" className="w-full" onClick={() => window.location.assign('/candidate/profile')}>
              View Full Progress
            </Button>
          </div>
        </Card>
      </aside>
    </div>
  );
}
