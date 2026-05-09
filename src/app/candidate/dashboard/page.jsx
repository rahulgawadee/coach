'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.email) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const emailParam = `?email=${encodeURIComponent(user.email)}`;

        // 1. Fetch coach info
        const coachResponse = await fetch(`/api/candidate/get-coach${emailParam}`);
        if (coachResponse.ok) {
          const coachPayload = await coachResponse.json();
          if (coachPayload.success && coachPayload.hasCoach) {
            setCoach(coachPayload.data);
          }
        }

        // 2. Fetch workspace (for sessions, messages, documents)
        const wsResponse = await fetch(`/api/candidate/profile${emailParam}`);
        const wsData = await wsResponse.json();
        if (wsData.success) {
          setWorkspace(wsData.data);
        }

        // 3. Fetch calendar (next session)
        const calendarResponse = await fetch(`/api/candidate/calendar${emailParam}`);
        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          const sessions = calendarData.data?.events || [];
          if (sessions.length > 0) {
            const upcoming = sessions
              .filter(s => s.status === 'confirmed' && new Date(s.date) >= new Date().setHours(0,0,0,0))
              .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
            setNextSession(upcoming);
          }
        }

        // 4. Fetch notifications/messages
        const messagesResponse = await fetch(`/api/candidate/messages${emailParam}`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setAnnouncements(messagesData.data?.announcements || []);
          const unread = messagesData.data?.coachMessages?.filter(m => !m.seen && m.sender !== 'candidate') || [];
          setUnreadMessages(unread.length);
        }

      } catch (err) {
        console.error('Dashboard load error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Calculate dynamic progress
  const stats = useMemo(() => {
    if (!workspace) return { percentage: 5, sessions: 0, docs: 0 };
    
    let score = 10; // Start with 10% for joining
    if (workspace.profile?.skills?.length > 0) score += 15;
    if (workspace.agreement?.signed) score += 10;
    
    const completedSessions = workspace.events?.filter(e => e.status === 'confirmed' && new Date(e.date) < new Date()).length || 0;
    score += Math.min(completedSessions * 10, 40); // Up to 40% for sessions
    
    const docs = workspace.documents?.length || 0;
    score += Math.min(docs * 5, 25); // Up to 25% for docs
    
    return {
      percentage: Math.min(score, 100),
      sessions: completedSessions,
      docs: docs,
      totalSessions: 8
    };
  }, [workspace]);

  const isWithinOneHour = (sessionDate, sessionTime) => {
    if (!sessionDate || !sessionTime) return false;
    try {
      const [hours, minutes] = sessionTime.split(':');
      const session = new Date(sessionDate);
      session.setHours(parseInt(hours), parseInt(minutes));
      const now = new Date();
      const diff = (session.getTime() - now.getTime()) / (1000 * 60);
      return diff >= -30 && diff <= 60; // Available 30 mins after start too
    } catch { return false; }
  };

  if (loading && !workspace) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Premium Welcome Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 p-10 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-blue-500/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-blue-300 border border-blue-500/30">
              Candidate Portal
            </span>
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4 leading-tight">
            Hej, {user?.name?.split(' ')[0] || 'Candidate'}!
          </h1>
          <p className="text-blue-100/80 text-xl max-w-2xl leading-relaxed">
            Your career acceleration journey is underway. You've completed <span className="text-white font-bold">{stats.percentage}%</span> of your initial roadmap.
          </p>
        </div>
        {/* Abstract shapes for premium feel */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Coach & Stats */}
        <div className="lg:col-span-2 space-y-8">
          {/* Enhanced Coach Card */}
          <Card className="p-0 overflow-hidden border-none shadow-xl shadow-slate-200/50">
            <div className="bg-white p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-100 flex items-center justify-center text-4xl shadow-inner border border-slate-100">
                    {coach?.coachAvatar ? (
                      <img src={coach.coachAvatar} alt="Coach" className="w-full h-full object-cover rounded-3xl" />
                    ) : '👨‍🏫'}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm" />
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{coach?.coachName || 'Assigning Coach...'}</h2>
                      <p className="text-blue-600 font-bold tracking-wide uppercase text-xs mt-1">
                        {coach?.coachCompany || 'Senior Career Mentor'}
                      </p>
                    </div>
                    {coach && (
                      <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                        <span className="text-amber-500 text-lg">★</span>
                        <span className="font-bold text-amber-900">{coach.coachRating || 4.9}</span>
                        <span className="text-gray-400 text-sm">({coach.coachReviews || 0} reviews)</span>
                      </div>
                    )}
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 italic">
                    "{coach?.coachBio || 'Your coach will help you navigate the job market and optimize your professional profile for success.'}"
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(coach?.coachExpertise || ['CV Review', 'Interviews', 'Networking']).slice(0, 3).map(tag => (
                      <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-slate-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
                <Link href="/candidate/messages">
                  <Button variant="outline" className="w-full justify-center gap-2 py-4 rounded-2xl font-bold border-2">
                    💬 Send Message
                  </Button>
                </Link>
                <Link href="/candidate/calendar">
                  <Button variant="primary" className="w-full justify-center gap-2 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200">
                    📅 Book Session
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Activity Feed / Announcements */}
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">📢</span>
                Announcements
              </h3>
              {announcements.length > 0 && (
                <Link href="/candidate/messages" className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">
                  View All
                </Link>
              )}
            </div>
            
            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map((ann, i) => (
                  <div key={i} className="group p-5 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <p className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors">{ann.subject || 'Program Update'}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{ann.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm font-medium">No new announcements today.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Progress & Next Session */}
        <div className="space-y-8">
          {/* Dynamic Progress Card */}
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 bg-white">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Program Progress</h3>
            <div className="relative h-48 w-48 mx-auto mb-8">
              {/* Circular Progress Mock */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.92} strokeDashoffset={552.92 * (1 - stats.percentage / 100)} className="text-blue-600 transition-all duration-1000 ease-out" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900">{stats.percentage}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complete</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                <span className="text-xs font-bold text-slate-500 uppercase">Sessions</span>
                <span className="text-sm font-black text-slate-900">{stats.sessions} / {stats.totalSessions}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                <span className="text-xs font-bold text-slate-500 uppercase">Documents</span>
                <span className="text-sm font-black text-slate-900">{stats.docs} Shared</span>
              </div>
            </div>
          </Card>

          {/* Next Session Card */}
          <Card className="p-8 border-none shadow-xl shadow-blue-600/5 bg-blue-600 text-white">
            <h3 className="text-sm font-bold text-blue-200 uppercase tracking-widest mb-6">Upcoming Session</h3>
            {nextSession ? (
              <div className="space-y-6">
                <div>
                  <p className="text-2xl font-black mb-2">{nextSession.title || 'Career Strategy'}</p>
                  <div className="flex items-center gap-3 text-blue-100 font-medium">
                    <span className="bg-white/20 px-2 py-1 rounded text-xs">{new Date(nextSession.date).toLocaleDateString()}</span>
                    <span className="bg-white/20 px-2 py-1 rounded text-xs">{nextSession.time}</span>
                  </div>
                </div>
                
                {isWithinOneHour(nextSession.date, nextSession.time) ? (
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 py-4 font-black rounded-2xl shadow-xl">
                    🎥 Join Video Call
                  </Button>
                ) : (
                  <Link href="/candidate/calendar">
                    <Button className="w-full bg-blue-500 text-white border-2 border-blue-400 py-4 font-black rounded-2xl">
                      📅 View Details
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-blue-100 mb-6 font-medium">No sessions scheduled.</p>
                <Link href="/candidate/calendar">
                  <Button className="w-full bg-white text-blue-600 font-bold rounded-2xl py-3">
                    Schedule Now
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Messages', icon: '💬', href: '/candidate/messages', color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Calendar', icon: '📅', href: '/candidate/calendar', color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Documents', icon: '📄', href: '/candidate/documents', color: 'bg-amber-50 text-amber-600' },
          { label: 'Dashboard', icon: '🏠', href: '/candidate/dashboard', color: 'bg-rose-50 text-rose-600' },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <div className="group bg-white p-6 rounded-3xl border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-widest">{item.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
