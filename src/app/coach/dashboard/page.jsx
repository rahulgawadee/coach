"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/api';
import Modal from '@/components/ui/Modal';
import SafeDate from '@/components/ui/SafeDate';
import { 
  Users, 
  Clock, 
  MessageSquare, 
  Megaphone, 
  Star, 
  CheckCircle2, 
  ChevronRight, 
  FileText, 
  Upload,
  UserCheck,
  TrendingUp,
  Bell
} from 'lucide-react';

// Avatar helper: shows photo if available, fallback to initials
const AvatarCell = ({ name, avatarUrl, size = 40 }) => {
  const [imgError, setImgError] = useState(false);
  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-glow)', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 700, fontSize: size * 0.38 }}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
};

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

export default function CoachDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeCandidates, setActiveCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [coach, setCoach] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (!storedUser) router.push('/login');
  }, [router]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [pendingRes, activeCandidatesRes] = await Promise.all([
        apiService.coach.getPendingRequests(),
        apiService.coach.getActiveCandidates(),
      ]);

      if (pendingRes.success) {
        setPendingRequests(pendingRes.requests || []);
        if (pendingRes.requests?.length > 0 && !selectedRequest) {
          setSelectedRequest(pendingRes.requests[0]);
        }
      }
      if (activeCandidatesRes.success) setActiveCandidates(activeCandidatesRes.candidates || []);

      const coachProfileRes = await apiService.coach.getProfile();
      if (coachProfileRes.success) setCoach(coachProfileRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(loadData, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleAccept = async (assignmentId) => {
    try {
      setActionLoading(true);
      const response = await apiService.coach.acceptCandidate(assignmentId);
      if (response.success) {
        const remaining = pendingRequests.filter(r => r.assignmentId !== assignmentId);
        setPendingRequests(remaining);
        if (remaining.length > 0) {
          setSelectedRequest(remaining[0]);
        } else {
          setShowRequestModal(false);
          setSelectedRequest(null);
        }
        loadData();
      }
    } catch (error) {
      alert('Failed to accept candidate.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (assignmentId) => {
    const reason = prompt('Please provide a reason for declining (optional):');
    if (reason === null) return;
    try {
      setActionLoading(true);
      const response = await apiService.coach.declineCandidate(assignmentId, reason);
      if (response.success) {
        const remaining = pendingRequests.filter(r => r.assignmentId !== assignmentId);
        setPendingRequests(remaining);
        if (remaining.length > 0) {
          setSelectedRequest(remaining[0]);
        } else {
          setShowRequestModal(false);
          setSelectedRequest(null);
        }
        loadData();
      }
    } catch (error) {
      alert('Failed to decline candidate.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || loading) {
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
          backdrop-filter: blur(24px);
          border-radius: 32px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 20px 40px -10px var(--primary-glow);
        }
        .coach-gradient {
          background: linear-gradient(135deg, var(--background) 0%, var(--primary-glow) 100%);
          border: none;
          box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);
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
          align-items: center; gap: 8px;
          transition: all 0.3s ease;
        }
        .btn-outline-premium:hover {
          background: var(--card-bg);
          border-color: var(--primary);
        }
        .stat-badge {
          background: var(--card-bg);
          border-radius: 20px;
          padding: 16px 20px;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }
        .stat-badge:hover {
          background: var(--primary-glow);
          border-color: var(--primary-glow);
          transform: translateX(4px);
        }
        @media (max-width: 640px) {
          .serif { font-size: 2.2rem !important; }
          .glass-card { border-radius: 20px; }
          .hero-gradient { padding: 2rem 1.5rem !important; }
        }
      `}</style>

      <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
        {/* HERO SECTION */}
        <div className="glass-card coach-gradient p-6 sm:p-10 md:p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
            <svg viewBox="0 0 400 400" className="w-full h-full text-var(--primary)">
              <defs>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle cx="300" cy="100" r="150" fill="url(#grad2)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-var(--primary-glow) border border-var(--primary) text-var(--primary) text-[10px] font-bold uppercase tracking-widest mb-6">
              <Star size={12} className="animate-pulse" />
              Mentor Workspace
            </div>
            <h1 className="serif text-3xl sm:text-5xl md:text-6xl text-var(--text-primary) mb-4 sm:mb-6 leading-[1.1]">
              Welcome back, <br />
              <span className="italic bg-gradient-to-r from-var(--primary) to-var(--accent) bg-clip-text text-transparent">
                {user.name.split(' ')[0]}
              </span>
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mt-6 sm:mt-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-var(--primary-glow) border border-var(--primary) flex items-center justify-center text-var(--primary)">
                  <Users size={24} className="sm:w-7 sm:h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-0.5">Active Mentees</p>
                  <p className="text-xl sm:text-2xl font-bold text-var(--text-primary)">{activeCandidates.length} <span className="text-sm font-medium text-var(--text-secondary) ml-1">Students</span></p>
                </div>
              </div>
              <div className="hidden sm:block h-10 w-px bg-var(--card-border)" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-var(--primary-glow) border border-var(--primary) flex items-center justify-center text-var(--primary)">
                  <TrendingUp size={24} className="sm:w-7 sm:h-7" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-0.5">Performance</p>
                  <p className="text-xl sm:text-2xl font-bold text-var(--text-primary)">4.9 <span className="text-sm font-medium text-var(--text-secondary) ml-1">Rating</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PENDING REQUESTS ACTION BANNER */}
        {pendingRequests.length > 0 && (
          <div className="glass-card p-8 bg-var(--primary-glow) border-none relative overflow-hidden group">
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-var(--card-bg) border border-var(--primary) border-opacity-20 flex items-center justify-center text-var(--primary) shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <UserCheck size={28} className="sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-var(--text-primary)">Action Required</h2>
                  <p className="text-var(--text-muted) text-xs sm:text-sm mt-1 font-medium">You have <span className="text-var(--primary) font-bold">{pendingRequests.length}</span> requests waiting for review.</p>
                </div>
              </div>
              <button 
                className="btn-premium px-8 py-4 text-base w-full lg:w-auto justify-center"
                onClick={() => {
                  if (pendingRequests.length > 0 && !selectedRequest) {
                    setSelectedRequest(pendingRequests[0]);
                  }
                  setShowRequestModal(true);
                }}
              >
                Review Requests <ChevronRight size={20} />
              </button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-sky-500/5 to-transparent pointer-events-none" />
          </div>
        )}

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CANDIDATES TABLE */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full bg-var(--primary)" />
                  <h3 className="text-lg font-bold text-var(--text-primary)">Active Candidates</h3>
                </div>
                <Link href="/coach/candidates" className="text-xs font-bold text-var(--text-muted) hover:text-var(--primary) transition-colors uppercase tracking-widest flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-var(--card-border)">
                      <th className="pb-4 text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest">Candidate</th>
                      <th className="pb-4 text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest hidden sm:table-cell">Profile</th>
                      <th className="pb-4 text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest hidden md:table-cell">Skills</th>
                      <th className="pb-4 text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-var(--card-border)">
                    {activeCandidates.length > 0 ? (
                      activeCandidates.map((c) => (
                        <tr key={c.candidateId} className="group hover:bg-var(--primary-glow) transition-colors">
                          <td className="py-5">
                            <div className="flex items-center gap-3">
                              <AvatarCell name={c.candidateName} avatarUrl={c.avatarUrl} size={42} />
                              <div>
                                <p className="text-sm font-bold text-var(--text-primary) group-hover:text-var(--primary) transition-colors">{c.candidateName}</p>
                                <p className="text-[10px] text-var(--text-muted)">{c.candidateEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 hidden sm:table-cell">
                            <span className="text-xs text-var(--text-secondary) font-light">{c.profileData?.occupation || 'Student'}</span>
                          </td>
                          <td className="py-5 hidden md:table-cell">
                            <div className="flex flex-wrap gap-1.5">
                              {(c.profileData?.skills || []).slice(0, 2).map(skill => (
                                <span key={skill} className="px-2 py-0.5 rounded bg-var(--primary-glow) border border-var(--primary) text-[9px] font-bold text-var(--primary) uppercase">
                                  {skill}
                                </span>
                              ))}
                              {c.profileData?.skills?.length > 2 && (
                                <span className="text-[9px] text-var(--text-muted) font-bold">+{c.profileData.skills.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-5 text-right">
                            <Link href={`/coach/candidates/${c.candidateId}`}>
                              <button className="btn-outline-premium py-2 px-4 text-[11px] font-bold">Details</button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-12 text-center text-var(--text-muted) italic text-sm font-light">
                          Your candidate roster is currently empty.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SIDEBAR WIDGETS */}
          <div className="space-y-8">
            {/* QUICK TOOLS */}
            <div className="glass-card p-8 border-none">
              <h3 className="text-sm font-bold text-var(--text-primary) mb-6 uppercase tracking-widest">Mentor Tools</h3>
              <div className="space-y-3">
                <button className="stat-badge flex items-center gap-4 w-full group">
                  <div className="w-10 h-10 rounded-xl bg-var(--primary-glow) flex items-center justify-center text-var(--primary) group-hover:scale-110 transition-transform">
                    <Megaphone size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-var(--text-primary)">Broadcast</p>
                    <p className="text-[10px] text-var(--text-muted)">Msg all mentees</p>
                  </div>
                </button>
                <button className="stat-badge flex items-center gap-4 w-full group">
                  <div className="w-10 h-10 rounded-xl bg-var(--primary-glow) flex items-center justify-center text-var(--primary) group-hover:scale-110 transition-transform">
                    <Upload size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-var(--text-primary)">Resources</p>
                    <p className="text-[10px] text-var(--text-muted)">Shared templates</p>
                  </div>
                </button>
                <button className="stat-badge flex items-center gap-4 w-full group">
                  <div className="w-10 h-10 rounded-xl bg-var(--primary-glow) flex items-center justify-center text-var(--primary) group-hover:scale-110 transition-transform">
                    <FileText size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-var(--text-primary)">Reports</p>
                    <p className="text-[10px] text-var(--text-muted)">Progress analytics</p>
                  </div>
                </button>
              </div>
            </div>

            {/* UPCOMING SESSIONS WIDGET */}
            <div className="glass-card p-8 bg-var(--primary-glow) border-var(--primary)">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-var(--text-primary) uppercase tracking-widest">Next Session</h3>
                <Bell size={14} className="text-var(--primary)" />
              </div>
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-var(--card-bg) flex items-center justify-center mx-auto mb-4 text-var(--text-muted)">
                  <Clock size={24} />
                </div>
                <p className="text-sm text-var(--text-muted) mb-6 font-light">No sessions booked for the next 24 hours.</p>
                <Link href="/coach/calendar" className="btn-premium w-full justify-center">
                  Open Calendar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: PENDING REQUESTS */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title={`Review Match Requests (${pendingRequests.length})`}
        size="6xl"
      >
        <div className="flex flex-col lg:flex-row h-full max-h-[85vh] lg:h-[70vh] -mx-6 -mb-6 bg-[var(--background)] rounded-b-2xl overflow-hidden border-t border-[var(--card-border)]">
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[var(--card-border)] bg-[var(--sidebar-bg)] overflow-y-auto p-4 flex lg:flex-col gap-2 no-scrollbar">
            {pendingRequests.map((request) => {
              const isSelected = selectedRequest?.assignmentId === request.assignmentId;
              return (
                <button
                  key={request.assignmentId}
                  onClick={() => setSelectedRequest(request)}
                  className={`flex-shrink-0 lg:flex-shrink-1 text-left p-3 rounded-xl transition-all border ${isSelected ? 'bg-sky-500/10 border-sky-500/30 shadow-lg' : 'border-transparent hover:bg-white/5'} min-w-[200px] lg:min-w-0`}
                >
                  <div className="flex items-center gap-3">
                    <AvatarCell name={request.candidateName} avatarUrl={request.avatarUrl} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className={`font-bold text-sm truncate ${isSelected ? 'text-var(--primary)' : 'text-var(--text-primary)'}`}>{request.candidateName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <TrendingUp size={10} className="text-var(--primary)" />
                        <span className="text-[9px] font-bold text-var(--primary) uppercase tracking-tighter">Match: {request.matchScore}%</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
            {selectedRequest ? (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-32">
                <div className="flex flex-col sm:flex-row items-start justify-between pb-8 border-b border-[var(--card-border)] gap-6">
                  <div className="flex items-center gap-6">
                    <AvatarCell name={selectedRequest.candidateName} avatarUrl={selectedRequest.avatarUrl} size={72} />
                    <div className="space-y-2">
                      <h2 className="serif text-4xl text-var(--text-primary)">{selectedRequest.candidateName}</h2>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-lg bg-var(--card-bg) border border-var(--card-border) text-[11px] font-bold text-var(--text-muted) uppercase tracking-widest">
                          {selectedRequest.profile?.occupation || 'Candidate'}
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-var(--primary-glow) border border-var(--primary) text-[11px] font-bold text-var(--primary) uppercase tracking-widest">
                          Score: {selectedRequest.matchScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-1">Received On</p>
                    <p className="text-sm font-medium text-var(--text-secondary)"><SafeDate date={selectedRequest.requestedAt} /></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-var(--card-bg) border border-var(--card-border)">
                    <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-2">Education</p>
                    <p className="text-sm font-medium text-var(--text-primary)">{selectedRequest.profile?.education || 'N/A'}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-var(--card-bg) border border-var(--card-border)">
                    <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-2">Experience</p>
                    <p className="text-sm font-medium text-var(--text-primary)">{selectedRequest.profile?.experience || 0} Years</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-var(--card-bg) border border-var(--card-border)">
                    <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest mb-2">Desired field</p>
                    <p className="text-sm font-medium text-var(--text-primary)">{selectedRequest.profile?.industryPreferences?.[0] || 'Any'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-var(--text-primary) uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-var(--primary)" /> Professional Summary
                  </h4>
                  <div className="p-6 rounded-2xl bg-var(--card-bg) border border-var(--card-border) text-var(--text-secondary) text-sm leading-relaxed font-light italic">
                    "{selectedRequest.profile?.about || 'No detailed summary provided.'}"
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-var(--text-primary) uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-var(--primary)" /> Core Competencies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRequest.profile?.skills || []).map(skill => (
                      <span key={skill} className="px-3 py-1.5 rounded-xl bg-var(--primary-glow) border border-var(--primary) text-var(--primary) text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sticky Modal Actions */}
                <div className="sticky lg:absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-[var(--background)] backdrop-blur-md border-t border-[var(--card-border)] flex flex-col sm:flex-row gap-4 z-20">
                  <button 
                    className="btn-premium flex-1 py-4 text-base"
                    onClick={() => handleAccept(selectedRequest.assignmentId)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Accept Candidate Match'}
                  </button>
                  <button 
                    className="btn-outline-premium flex-1 py-4 text-base text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
                    onClick={() => handleDecline(selectedRequest.assignmentId)}
                    disabled={actionLoading}
                  >
                    Decline Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <Users size={64} className="text-var(--text-muted) mb-6" />
                <h3 className="serif text-2xl text-var(--text-primary)">Select a Profile</h3>
                <p className="text-var(--text-muted) text-sm mt-2 max-w-xs mx-auto">Choose a candidate from the roster to begin your professional evaluation.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
