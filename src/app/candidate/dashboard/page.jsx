"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Video, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Megaphone, 
  Star, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

// Subtle animated background lines
const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'var(--background)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
        <path d="M 72 0 L 0 0 0 72" fill="none" stroke="var(--primary)" strokeWidth="0.5"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <style>{`
      @keyframes driftSlow{0%{transform:translate(-50%,-50%) scale(1)}100%{transform:translate(-42%,-58%) scale(1.15)}}
    `}</style>
  </div>
);

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState(null);
  const [nextSession, setNextSession] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [recentMessages, setRecentMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user?.email) return;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const emailParam = `?email=${encodeURIComponent(user.email)}`;

        const coachResponse = await fetch(`/api/candidate/get-coach${emailParam}`);
        if (coachResponse.ok) {
          const coachPayload = await coachResponse.json();
          if (coachPayload.success && coachPayload.hasCoach) setCoach(coachPayload.data);
        }

        const wsResponse = await fetch(`/api/candidate/profile${emailParam}`);
        if (wsResponse.ok) {
          const wsData = await wsResponse.json();
          if (wsData.success) setWorkspace(wsData.data);
        }

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

        const messagesResponse = await fetch(`/api/candidate/messages${emailParam}`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setAnnouncements(messagesData.data?.announcements || []);
          const cMessages = messagesData.data?.coachMessages || [];
          const unread = cMessages.filter(m => !m.seen && m.sender !== 'candidate');
          setUnreadMessages(unread.length);
          const sortedMsgs = [...cMessages].sort((a,b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
          setRecentMessages(sortedMsgs.slice(0, 3));
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  const stats = useMemo(() => {
    if (!workspace) return { percentage: 5, sessions: 0, docs: 0 };
    let score = 10;
    if (workspace.profile?.skills?.length > 0) score += 15;
    if (workspace.agreement?.signed) score += 10;
    const completedSessions = workspace.events?.filter(e => e.status === 'confirmed' && new Date(e.date) < new Date()).length || 0;
    score += Math.min(completedSessions * 10, 40);
    const docs = workspace.documents?.length || 0;
    score += Math.min(docs * 5, 25);
    return { percentage: Math.min(score, 100), sessions: completedSessions, docs, totalSessions: 8 };
  }, [workspace]);

  const isWithinOneHour = (sessionDate, sessionTime) => {
    if (!sessionDate || !sessionTime) return false;
    try {
      const [hours, minutes] = sessionTime.split(':');
      const session = new Date(sessionDate);
      session.setHours(parseInt(hours), parseInt(minutes));
      const now = new Date();
      const diff = (session.getTime() - now.getTime()) / (1000 * 60);
      return diff >= -30 && diff <= 60;
    } catch { return false; }
  };

  if (loading && !workspace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid var(--primary-glow)', borderTop:'1.5px solid var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
      <BackgroundGrid />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
          background: var(--card-bg);
          border-color: var(--primary);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .hero-gradient {
          background: var(--primary-glow);
          border: 1px solid var(--primary);
        }
        .stat-badge {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 16px 20px;
          transition: all 0.3s ease;
        }
        .stat-badge:hover {
          background: var(--primary-glow);
          border-color: var(--primary);
        }
        .btn-premium {
          background: var(--primary);
          color: white;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px var(--primary-glow);
        }
        .btn-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px var(--primary-glow);
          filter: brightness(1.1);
        }
        .btn-outline-premium {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          color: var(--text-primary);
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }
        .btn-outline-premium:hover {
          background: var(--card-bg);
          border-color: var(--primary);
        }
        @media (max-width: 640px) {
          .serif { font-size: 2.5rem !important; }
          .glass-card { border-radius: 20px; }
          .hero-gradient { padding: 2rem 1.5rem !important; }
        }
      `}</style>

      <div className="space-y-8">
        {/* HERO SECTION */}
        <div className="glass-card hero-gradient p-10 md:p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
            <svg viewBox="0 0 400 400" className="w-full h-full text-var(--primary)">
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle cx="300" cy="100" r="150" fill="url(#grad1)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-var(--primary-glow) border border-var(--primary) text-var(--primary) text-[10px] font-bold uppercase tracking-widest mb-6">
              <Sparkles size={12} className="animate-pulse" />
              Your Roadmap
            </div>
            <h1 className="serif text-4xl sm:text-5xl md:text-6xl text-var(--text-primary) mb-6 leading-[1.1]">
              Welcome back, <br />
              <span className="italic bg-gradient-to-r from-var(--primary) to-var(--accent) bg-clip-text text-transparent">
                {user?.name?.split(' ')[0] || 'Candidate'}
              </span>
            </h1>
            <div className="flex flex-col md:flex-row md:items-center gap-6 mt-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-var(--primary-glow) border border-var(--primary) flex items-center justify-center text-var(--primary)">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-0.5">Profile Score</p>
                  <p className="text-2xl font-bold text-var(--text-primary)">{stats.percentage}% <span className="text-sm font-medium text-var(--text-secondary) ml-1">Complete</span></p>
                </div>
              </div>
              <div className="h-10 w-px bg-var(--card-border) hidden md:block" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-var(--primary-glow) border border-var(--primary) flex items-center justify-center text-var(--primary)">
                  <Video size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-0.5">Sessions</p>
                  <p className="text-2xl font-bold text-var(--text-primary)">{stats.sessions} <span className="text-sm font-medium text-var(--text-secondary) ml-1">Completed</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MENTOR & MESSAGES */}
          <div className="lg:col-span-2 space-y-8">
            {/* MENTOR CARD */}
            <div className="glass-card p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full bg-var(--primary)" />
                  <h3 className="text-lg font-bold text-var(--text-primary)">Your Assigned Coach</h3>
                </div>
                <button className="text-xs font-bold text-var(--text-muted) hover:text-var(--text-primary) transition-colors uppercase tracking-widest flex items-center gap-1">
                  View Profile <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-var(--primary-glow) border border-var(--card-border) shadow-xl">
                    {coach?.coachAvatar ? (
                      <img src={coach.coachAvatar} alt="Coach" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <MessageSquare size={32} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 border-4 border-var(--background) flex items-center justify-center shadow-lg">
                    <CheckCircle2 size={10} className="text-white" />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="serif text-3xl text-var(--text-primary)">{coach?.coachName || 'Assigning Your Coach...'}</h2>
                    {coach && (
                      <div className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> {coach.coachRating || 4.9}
                      </div>
                    )}
                  </div>
                  <p className="text-var(--primary) text-xs font-bold uppercase tracking-widest">{coach?.coachName ? (coach?.coachCompany || 'Senior Career Strategist') : ''}</p>
                  <p className="text-var(--text-secondary) text-sm leading-relaxed max-w-xl font-light">
                    "{coach?.coachBio || 'Your mentor is being selected to match your career goals and industry expertise.'}"
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(coach?.coachExpertise || ['CV Review', 'Mock Interview', 'Networking']).map(tag => (
                      <span key={tag} className="px-3 py-1 rounded-full bg-var(--card-bg) border border-var(--card-border) text-[10px] font-bold text-var(--text-muted) uppercase tracking-tight">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
                <Link href="/candidate/messages" className="btn-outline-premium justify-center">
                  <MessageSquare size={18} /> Message Coach
                </Link>
                <Link href="/candidate/calendar" className="btn-premium justify-center">
                  <Calendar size={18} /> Schedule Session
                </Link>
              </div>
            </div>

            {/* MESSAGES & ANNOUNCEMENTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* MESSAGES */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-var(--text-primary) flex items-center gap-2">
                    <MessageSquare size={16} className="text-var(--primary)" /> Recent Chat
                  </h3>
                  {unreadMessages > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-var(--primary) text-white text-[10px] font-bold">
                      {unreadMessages} New
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {recentMessages.length > 0 ? recentMessages.map((msg, i) => (
                    <Link href="/candidate/messages" key={i} className="block group">
                      <div className="p-3 rounded-xl bg-var(--card-bg) border border-transparent group-hover:bg-var(--primary-glow) group-hover:border-var(--primary) transition-all">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[11px] font-bold text-var(--text-secondary)">{msg.senderName || 'Coach'}</p>
                          <p className="text-[9px] text-var(--text-muted)"><Clock size={8} className="inline mr-1" /> {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</p>
                        </div>
                        <p className="text-xs text-var(--text-muted) truncate group-hover:text-var(--text-primary)">{msg.text}</p>
                      </div>
                    </Link>
                  )) : (
                    <div className="py-10 text-center">
                      <p className="text-xs text-slate-500 italic">No recent messages</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ANNOUNCEMENTS */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-var(--text-primary) flex items-center gap-2">
                    <Megaphone size={16} className="text-var(--accent)" /> Program Updates
                  </h3>
                </div>
                <div className="space-y-3">
                  {announcements.length > 0 ? announcements.slice(0, 3).map((ann, i) => (
                    <div key={i} className="p-3 rounded-xl bg-var(--card-bg) border border-transparent hover:bg-var(--primary-glow) hover:border-var(--primary) transition-all cursor-default group">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[11px] font-bold text-var(--text-secondary) truncate max-w-[70%]">{ann.subject || 'Program Update'}</p>
                        <p className="text-[9px] text-var(--text-muted)">{new Date(ann.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="text-xs text-var(--text-muted) truncate group-hover:text-var(--text-primary)">{ann.text}</p>
                    </div>
                  )) : (
                    <div className="py-10 text-center">
                      <p className="text-xs text-slate-500 italic">No recent updates</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR WIDGETS */}
          <div className="space-y-8">
            {/* UPCOMING SESSION */}
            <div className="glass-card p-8 bg-var(--primary-glow) border-var(--primary)">
              <h3 className="text-sm font-bold text-var(--text-primary) mb-6 uppercase tracking-widest">Next Meeting</h3>
              {nextSession ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="serif text-2xl text-var(--text-primary) mb-2">{nextSession.title || 'Mentorship Sync'}</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-var(--card-bg) border border-var(--card-border) text-[11px] font-medium text-var(--text-secondary)">
                        {new Date(nextSession.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="px-3 py-1.5 rounded-lg bg-var(--card-bg) border border-var(--card-border) text-[11px] font-medium text-var(--text-secondary)">
                        {nextSession.time}
                      </span>
                    </div>
                  </div>
                  {isWithinOneHour(nextSession.date, nextSession.time) ? (
                    <button className="btn-premium w-full justify-center py-4 text-base">
                      <Video size={20} /> Join Call Now
                    </button>
                  ) : (
                    <Link href="/candidate/calendar" className="btn-outline-premium w-full justify-center py-4">
                      View in Calendar
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-500">
                    <Calendar size={24} />
                  </div>
                  <p className="text-sm text-slate-400 mb-6 font-light">No sessions scheduled for today.</p>
                  <Link href="/candidate/calendar" className="btn-premium w-full justify-center">
                    Book a Session
                  </Link>
                </div>
              )}
            </div>

            {/* QUICK ACTIONS */}
            <div className="glass-card p-8">
              <h3 className="text-sm font-bold text-var(--text-primary) mb-6 uppercase tracking-widest">Quick Access</h3>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/candidate/documents" className="stat-badge flex flex-col items-center justify-center text-center gap-3">
                  <FileText size={20} className="text-amber-500" />
                  <span className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest">Documents</span>
                </Link>
                <Link href="/candidate/profile" className="stat-badge flex flex-col items-center justify-center text-center gap-3">
                  <ShieldCheck size={20} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest">Profile</span>
                </Link>
                <Link href="/candidate/messages" className="stat-badge flex flex-col items-center justify-center text-center gap-3">
                  <MessageSquare size={20} className="text-var(--primary)" />
                  <span className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest">Chat</span>
                </Link>
                <Link href="/candidate/jobs" className="stat-badge flex flex-col items-center justify-center text-center gap-3">
                  <ArrowRight size={20} className="text-var(--accent)" />
                  <span className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest">Explore</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}