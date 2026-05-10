'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiService from '@/services/api';
import SafeDate from '@/components/ui/SafeDate';
import Modal from '@/components/ui/Modal';

// Subtle animated background lines — no orbs, no cartoonish particles
const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    {/* Deep base */}
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#06060f 0%,#090912 50%,#07070e 100%)' }} />
    {/* Faint geometric lines */}
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    {/* Soft gradient pools — large, low-opacity, sophisticated */}
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(14,116,144,0.06) 0%, transparent 70%)', filter:'blur(40px)' }} />
    {/* Animated slow drift accent */}
    <div style={{ position:'absolute', top:'40%', left:'50%', width:'30vw', height:'30vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)', filter:'blur(60px)', animation:'driftSlow 22s ease-in-out infinite alternate' }} />
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
        <div style={{ width:40, height:40, border:'1.5px solid rgba(14,165,233,0.15)', borderTop:'1.5px solid #0ea5e9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto pb-16 animate-in fade-in duration-500">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        .dash-root { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .card {
          background: rgba(255,255,255,0.028);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .card:hover { border-color: rgba(255,255,255,0.11); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }
        .pill {
          display:inline-flex; align-items:center; gap:6px;
          padding: 5px 12px; border-radius:999px;
          font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase;
        }
        .stat-row {
          display:flex; justify-content:space-between; align-items:center;
          padding:12px 16px; border-radius:12px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.045);
          transition: background 0.2s;
        }
        .stat-row:hover { background: rgba(255,255,255,0.055); }
        .msg-row {
          padding:14px 16px; border-radius:14px;
          background:rgba(255,255,255,0.025);
          border:1px solid transparent;
          transition: background 0.2s, border-color 0.2s;
          cursor:pointer;
        }
        .msg-row:hover { background:rgba(14,165,233,0.07); border-color:rgba(14,165,233,0.15); }
        .btn-primary {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:13px 20px; border-radius:12px; font-weight:600;
          font-size:13px; letter-spacing:0.01em; cursor:pointer; border:none;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color:#fff; box-shadow: 0 4px 20px rgba(2,132,199,0.25);
          transition: box-shadow 0.25s, transform 0.2s;
        }
        .btn-primary:hover { box-shadow: 0 8px 30px rgba(2,132,199,0.38); transform:translateY(-1px); }
        .btn-ghost {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:13px 20px; border-radius:12px; font-weight:600;
          font-size:13px; cursor:pointer;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.85);
          transition: background 0.2s, border-color 0.2s;
        }
        .btn-ghost:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); }
        .section-label {
          font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase;
          color:rgba(255,255,255,0.3);
        }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .delay-1 { animation-delay:0.07s; }
        .delay-2 { animation-delay:0.14s; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="dash-root space-y-7">
        {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
        <div className="fade-up card relative overflow-hidden" style={{ padding:'52px 52px 44px', borderRadius:24 }}>
          <div style={{ position:'absolute', top:0, right:0, width:320, height:320, background:'radial-gradient(circle at top right, rgba(14,165,233,0.09) 0%, transparent 65%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:0, left:0, width:200, height:200, background:'radial-gradient(circle at bottom left, rgba(79,70,229,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:1 }}>
            <div className="pill" style={{ background:'rgba(14,165,233,0.1)', color:'#bae6fd', border:'1px solid rgba(14,165,233,0.2)', marginBottom:20 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#38bdf8', display:'inline-block', animation:'pulse 2s infinite' }}></span>
              Coach Portal
            </div>
            <h1 className="serif" style={{ fontSize:'clamp(2rem,4vw,3.2rem)', color:'#fff', lineHeight:1.1, marginBottom:12, fontWeight:400, letterSpacing:'-0.01em' }}>
              Welcome back,{' '}
              <span style={{ fontStyle:'italic', background:'linear-gradient(90deg,#7dd3fc,#38bdf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                {user.name.split(' ')[0]}
              </span>
            </h1>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:15, lineHeight:1.7, maxWidth:520, margin:0, fontWeight:300 }}>
              Your mentorship dashboard is ready. You are currently guiding{' '}
              <span style={{ color:'rgba(255,255,255,0.75)', fontWeight:500 }}>{activeCandidates.length} mentees</span>.
            </p>
          </div>
        </div>

        {/* ── PENDING REQUESTS BANNER ─────────────────────────────────────────── */}
        {pendingRequests.length > 0 && (
          <div className="fade-up delay-1 card overflow-hidden relative" style={{ padding: '32px 40px', background: 'linear-gradient(to right, rgba(14,165,233,0.15), rgba(79,70,229,0.15))', borderColor: 'rgba(56,189,248,0.2)' }}>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="pill" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>Action Required</div>
                <h2 className="text-2xl font-semibold text-white">
                  {pendingRequests.length} New Candidate {pendingRequests.length === 1 ? 'Request' : 'Requests'}
                </h2>
                <p className="text-slate-300 text-sm">Potential matches are waiting for your response.</p>
              </div>
              <button 
                className="btn-primary" 
                style={{ width: 'auto', padding: '14px 32px' }}
                onClick={() => {
                  if (pendingRequests.length > 0 && !selectedRequest) {
                    setSelectedRequest(pendingRequests[0]);
                  }
                  setShowRequestModal(true);
                }}
              >
                Review Requests →
              </button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          </div>
        )}

        {/* ── MAIN CONTENT GRID ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 fade-up delay-2">
          
          <div className="lg:col-span-2 space-y-7">
            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Active Mentees', value: activeCandidates.length, bg: 'rgba(14,165,233,0.1)', color: '#38bdf8' },
                { label: 'Pending', value: pendingRequests.length, bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' },
                { label: 'Messages', value: 0, bg: 'rgba(168,85,247,0.1)', color: '#c084fc' },
                { label: 'Success Rate', value: '94%', bg: 'rgba(16,185,129,0.1)', color: '#34d399' },
              ].map((stat, i) => (
                <div key={i} className="card p-5 flex flex-col items-center justify-center text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="section-label mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* CANDIDATES LIST */}
            <div className="card" style={{ padding: '32px' }}>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="serif text-2xl text-white">Current Candidates</h3>
                  <p className="text-sm text-slate-400 mt-1 font-light">Mentees you are actively guiding.</p>
                </div>
                <Link href="/coach/candidates" className="text-xs font-bold text-sky-400 uppercase tracking-widest hover:text-sky-300 transition-colors">View All →</Link>
              </div>

              <div className="space-y-3">
                {activeCandidates.length > 0 ? (
                  activeCandidates.map((c) => (
                    <div key={c.candidateId} className="msg-row flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-sky-900/50 flex items-center justify-center border border-sky-800 text-sky-400 font-bold">
                          {c.candidateName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{c.candidateName}</p>
                          <p className="text-xs text-slate-500 font-light mt-0.5">Started: {new Date(c.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Progress</p>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${c.progress}%` }} />
                            </div>
                            <span className="text-xs font-medium text-slate-300">{c.progress}%</span>
                          </div>
                        </div>
                        <button className="btn-ghost" style={{ padding: '6px 12px', width: 'auto' }}>Open</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 px-4 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-slate-400 font-light text-sm">No active mentees assigned yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-7">
            {/* QUICK TOOLS */}
            <div className="card p-6">
              <h3 className="section-label mb-4">Quick Tools</h3>
              <div className="space-y-3">
                {[
                  { label: 'Broadcast Message', icon: '📢', color: '#818cf8' },
                  { label: 'Upload Templates', icon: '📁', color: '#fbbf24' },
                  { label: 'Review Reports', icon: '📄', color: '#34d399' },
                ].map((tool, i) => (
                  <button key={i} className="msg-row flex items-center gap-4 w-full">
                    <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10" style={{ color: tool.color }}>
                      {tool.icon}
                    </span>
                    <span className="text-sm text-slate-300 font-medium">{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: PENDING REQUESTS ───────────────────────────────────────────── */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title={`Review Pending Requests (${pendingRequests.length})`}
        size="6xl"
      >
        <div className="flex flex-col md:flex-row gap-0 h-[70vh] -mx-6 -mb-6 bg-[#0a0a14] rounded-b-2xl overflow-hidden border-t border-white/10">
          <div className="w-full md:w-80 border-r border-white/10 bg-[#06060f] overflow-y-auto">
            <div className="p-4 space-y-2">
              {pendingRequests.map((request) => {
                const isSelected = selectedRequest?.assignmentId === request.assignmentId;
                return (
                  <button
                    key={request.assignmentId}
                    onClick={() => setSelectedRequest(request)}
                    className="w-full text-left p-3 rounded-xl transition-all"
                    style={{
                      background: isSelected ? 'rgba(14,165,233,0.15)' : 'transparent',
                      border: `1px solid ${isSelected ? 'rgba(14,165,233,0.3)' : 'transparent'}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold border border-slate-700 text-sky-400">
                        {request.candidateName.charAt(0)}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className={`font-medium text-sm truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {request.candidateName}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          Match: {request.matchScore}%
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 relative">
            {selectedRequest ? (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 pb-24">
                <div className="flex items-start justify-between gap-6 pb-6 border-b border-white/10">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-white serif">{selectedRequest.candidateName}</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="pill" style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {selectedRequest.profile?.occupation || 'Candidate'}
                      </span>
                      <span className="pill" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                        Match Score: {selectedRequest.matchScore}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="section-label mb-1">Requested On</p>
                    <p className="text-sm font-medium text-slate-300"><SafeDate date={selectedRequest.requestedAt} /></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="section-label mb-2">Education</p>
                    <p className="text-sm font-medium text-slate-200">{selectedRequest.profile?.education || 'Not Specified'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="section-label mb-2">Experience</p>
                    <p className="text-sm font-medium text-slate-200">{selectedRequest.profile?.experience || 0} Years</p>
                  </div>
                </div>

                <div>
                  <h4 className="section-label mb-3">Professional Summary</h4>
                  <p className="text-slate-400 text-sm leading-relaxed italic bg-white/5 p-4 rounded-xl border border-white/10">
                    "{selectedRequest.profile?.about || 'No summary provided by candidate.'}"
                  </p>
                </div>

                <div>
                  <h4 className="section-label mb-3">Top Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedRequest.profile?.skills || []).map(skill => (
                      <span key={skill} className="px-3 py-1 bg-white/5 text-slate-300 text-xs font-medium rounded-lg border border-white/10">
                        {skill}
                      </span>
                    ))}
                    {(!selectedRequest.profile?.skills || selectedRequest.profile.skills.length === 0) && (
                      <span className="text-sm text-slate-500 italic">No skills listed.</span>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-sky-900/20 border border-sky-800/50 flex items-start gap-4">
                  <span className="text-xl mt-1">💡</span>
                  <div>
                    <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-1.5">Match Insight</h4>
                    <p className="text-sm text-sky-200/70 leading-relaxed font-light">
                      This candidate is looking for roles in <span className="text-white font-medium">{selectedRequest.profile?.industryPreferences?.[0] || 'your field'}</span>. Your expertise in <span className="text-white font-medium">{coach?.expertiseAreas?.[0] || 'Mentorship'}</span> makes you a perfect fit.
                    </p>
                  </div>
                </div>

                {/* Sticky Actions Container */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#0a0a14]/90 backdrop-blur-md border-t border-white/10 flex gap-4">
                  <button 
                    className="btn-primary" 
                    onClick={() => handleAccept(selectedRequest.assignmentId)}
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '16px' }}
                  >
                    {actionLoading ? 'Processing...' : '✓ Accept Candidate'}
                  </button>
                  <button 
                    className="btn-ghost" 
                    onClick={() => handleDecline(selectedRequest.assignmentId)}
                    disabled={actionLoading}
                    style={{ flex: 1, padding: '16px', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-2xl border border-white/10">
                  👋
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white serif">Select a Candidate</h3>
                  <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto font-light">Click on a name from the list on the left to review their profile details.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
