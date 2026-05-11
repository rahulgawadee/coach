'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Star, MessageSquare, Calendar, ShieldCheck, Award, Languages, RotateCcw, X, ChevronDown, ChevronUp } from 'lucide-react';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#06060f 0%,#090912 50%,#07070e 100%)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#6366f1" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(14,116,144,0.06) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', top:'40%', left:'50%', width:'30vw', height:'30vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)', filter:'blur(60px)', animation:'driftSlow 22s ease-in-out infinite alternate' }} />
    <style>{`@keyframes driftSlow{0%{transform:translate(-50%,-50%) scale(1)}100%{transform:translate(-42%,-58%) scale(1.15)}}`}</style>
  </div>
);

const SkillBar = ({ label, score }) => (
  <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
    <div className="flex justify-between items-center mb-3">
      <span className="text-xs sm:text-sm font-bold text-white">{label}</span>
      <span className="text-xs text-indigo-400 font-bold">{score}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${score}%` }} />
    </div>
  </div>
);

export default function CandidateMyCoachPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!user?.email) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const emailParam = `?email=${encodeURIComponent(user.email)}`;
        const coachRes = await fetch(`/api/candidate/get-coach${emailParam}`);
        const coachPayload = await coachRes.json();
        if (coachPayload?.success && coachPayload?.hasCoach) {
          setCoach(coachPayload.data);
        } else {
          setCoach(null);
        }
      } catch (err) {
        console.error('Error loading coach data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const submitReview = async () => {
    if (!coach || !user?.email) return;
    try {
      const res = await fetch('/api/candidate/coach-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId: coach.coachId, rating, comment, email: user.email }),
      });
      if (res.ok) {
        alert('Review submitted! Thank you.');
        setReviewOpen(false);
      }
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  const requestChange = async () => {
    const reason = prompt('Please provide a reason for the coach change request:');
    if (!reason || !user?.email) return;
    try {
      await fetch('/api/candidate/coach-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, reason }),
      });
      alert('Your request for a coach change has been submitted for review.');
    } catch (err) {
      alert('Failed to submit request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(99,102,241,0.15)', borderTop:'1.5px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!mounted) return null;

  if (!coach) {
    return (
      <div className="relative max-w-4xl mx-auto text-center py-16 sm:py-24 px-4 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
        <BackgroundGrid />
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
          <ShieldCheck size={36} className="text-indigo-400" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-['DM_Serif_Display'] text-white mb-4">No Coach Assigned</h2>
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8 sm:mb-10 font-light">
          You haven't been matched with a coach yet, or your request is still pending acceptance. Please check your dashboard for updates.
        </p>
        <Link href="/candidate/dashboard" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold text-sm shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:scale-105 transition-all">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 font-['DM_Sans',sans-serif] space-y-5 sm:space-y-8">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-panel {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          border-radius: 28px;
        }
        @media (max-width: 640px) {
          .glass-panel { border-radius: 20px; }
        }
        .btn-primary {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 20px; border-radius: 14px; width: 100%;
          font-size: 14px; font-weight: 700; cursor: pointer; border: none;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: #fff; box-shadow: 0 4px 20px rgba(99,102,241,0.25);
          transition: all 0.2s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.35); }
        .btn-outline {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 20px; border-radius: 14px; width: 100%;
          font-size: 14px; font-weight: 700; cursor: pointer;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0; transition: all 0.2s;
        }
        .btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); }
      `}</style>

      {/* Hero Profile Card */}
      <div className="glass-panel p-5 sm:p-8 md:p-10 relative overflow-hidden shadow-2xl shadow-black/20">
        {/* Active Badge */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Active Mentor
          </span>
        </div>

        {/* Profile Content */}
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 sm:gap-8 md:gap-10 pt-8 sm:pt-0">
          {/* Avatar */}
          <div className="relative shrink-0">
            {coach.coachAvatar ? (
              <img
                src={coach.coachAvatar}
                alt={coach.coachName}
                className="h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 rounded-[1.5rem] sm:rounded-[2rem] object-cover border-[3px] border-white/10 shadow-2xl"
              />
            ) : (
              <div className="h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 rounded-[1.5rem] sm:rounded-[2rem] bg-indigo-500/10 border-[3px] border-white/5 flex items-center justify-center shadow-2xl">
                <span className="text-4xl sm:text-5xl font-bold text-indigo-400">{coach.coachName?.charAt(0)}</span>
              </div>
            )}
            <div className="absolute -bottom-3 -right-3 bg-gradient-to-br from-indigo-500 to-cyan-500 text-white p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg border border-white/10">
              <ShieldCheck size={20} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-3 sm:space-y-4">
            <div>
              <h1 className="serif text-3xl sm:text-4xl md:text-5xl text-white tracking-tight mb-1.5">
                {coach.coachName}
              </h1>
              <p className="text-indigo-300 font-bold text-base sm:text-lg md:text-xl tracking-wide">
                {coach.coachCompany || 'Senior Career Coach'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-amber-100 font-bold text-sm">{coach.coachRating || 4.9}</span>
                  <span className="text-amber-500/70 text-[10px] font-bold uppercase tracking-widest">({coach.coachReviews || 15})</span>
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-white/20 hidden sm:block" />
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sweden</div>
              </div>
            </div>

            {/* Expertise Tags */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {(coach.coachExpertise || ['CV Review', 'Interviews', 'Networking']).map((tag) => (
                <span key={tag} className="rounded-xl bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-300 border border-white/10 uppercase tracking-widest hover:bg-white/10 transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 w-full sm:w-auto sm:shrink-0 sm:w-56 md:w-64">
            <Link href="/candidate/messages" className="btn-primary text-sm">
              <MessageSquare size={16} /> <span>Send Message</span>
            </Link>
            <Link href="/candidate/calendar" className="btn-outline text-sm">
              <Calendar size={16} /> <span>Book Session</span>
            </Link>
            <button
              className="text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest underline underline-offset-4 mt-1 sm:text-center hidden sm:block"
              onClick={() => setReviewOpen(true)}
            >
              Share Feedback
            </button>
          </div>
        </div>

        {/* Mobile feedback button */}
        <button
          className="sm:hidden mt-4 w-full text-[10px] text-slate-500 hover:text-slate-300 font-bold uppercase tracking-widest underline underline-offset-4 text-center"
          onClick={() => setReviewOpen(true)}
        >
          Share Feedback
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
        {/* Left Col - About & Specializations */}
        <div className="md:col-span-2 space-y-5 sm:space-y-8">
          {/* About */}
          <div className="glass-panel p-5 sm:p-8">
            <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Background & Approach
            </h4>
            <p className="text-slate-300 leading-relaxed text-base sm:text-lg font-light italic">
              "{coach.coachBio || "I am dedicated to helping candidates find their true potential and landing the job they deserve. With years of experience in recruitment and career coaching, I focus on practical strategies that work in the Swedish market."}"
            </p>
          </div>

          {/* Specializations */}
          <div className="glass-panel p-5 sm:p-8">
            <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-5 sm:mb-8 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Specializations
            </h4>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-5">
              {[
                { label: 'CV/Resume Optimization', score: 98 },
                { label: 'Interview Techniques', score: 95 },
                { label: 'Networking Strategies', score: 92 },
                { label: 'Skill Gap Analysis', score: 88 },
              ].map(item => (
                <SkillBar key={item.label} {...item} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Col - Details & Request Change */}
        <div className="space-y-5 sm:space-y-8">
          {/* Certifications & Languages */}
          <div className="glass-panel p-5 sm:p-8">
            {/* Mobile collapsible toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="md:hidden w-full flex items-center justify-between mb-4"
            >
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Details</h4>
              {showDetails ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </button>
            <h4 className="hidden md:block text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-8">Details</h4>

            <div className={`space-y-6 sm:space-y-8 ${showDetails ? 'block' : 'hidden md:block'}`}>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3 sm:mb-4">
                  <Languages size={13} className="text-indigo-400" /> Languages
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Swedish', 'English'].map((l) => (
                    <span key={l} className="bg-white/5 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide border border-white/10">
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3 sm:mb-4">
                  <Award size={13} className="text-indigo-400" /> Certifications
                </label>
                <div className="space-y-2 sm:space-y-3">
                  {['ICF Certified Coach', 'Senior HR Specialist'].map((c) => (
                    <div key={c} className="flex items-center gap-3 text-sm text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                        <Award size={14} />
                      </div>
                      <span className="font-bold text-xs sm:text-sm">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Change Request */}
          <div className="bg-rose-500/10 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 border border-rose-500/20 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-500/20 flex items-center justify-center mx-auto mb-3 sm:mb-4 text-rose-400">
              <RotateCcw size={18} />
            </div>
            <p className="text-xs text-rose-300 font-medium leading-relaxed mb-4 sm:mb-6">
              Not feeling the match? You can request a different coach if your career goals have shifted.
            </p>
            <button
              onClick={requestChange}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest underline underline-offset-4 transition-colors"
            >
              Request a Change
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0f0e1c] border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.6)] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            {/* Drag handle for mobile */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white">Review {coach.coachName}</h3>
              <button onClick={() => setReviewOpen(false)} className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Rating</label>
                <div className="flex gap-4 items-center bg-white/5 p-3 sm:p-4 rounded-2xl border border-white/10">
                  <input
                    type="range" min="1" max="5" value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="flex-1 accent-indigo-500"
                  />
                  <span className="text-xl sm:text-2xl font-black text-amber-400 flex items-center gap-1">
                    {rating} <Star size={18} fill="currentColor" />
                  </span>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Your Experience</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What do you like about working with this coach?"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:bg-white/10 transition-all h-28 sm:h-32 outline-none resize-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
              <button className="btn-outline flex-1 text-sm" onClick={() => setReviewOpen(false)}>Cancel</button>
              <button className="btn-primary flex-1 text-sm" onClick={submitReview}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
