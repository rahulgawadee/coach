'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { 
  User, 
  MessageSquare, 
  Calendar, 
  Play, 
  FileText, 
  CheckCircle2, 
  ArrowLeft,
  Briefcase,
  GraduationCap,
  MapPin,
  Clock,
  Sparkles,
  Shield,
  Download
} from 'lucide-react';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'var(--background)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.03 }} xmlns="http://www.w3.org/2000/svg">
      <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="var(--primary)" strokeWidth="0.5"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-10%', right:'-5%', width:'70vw', height:'70vw', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter:'blur(60px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', left:'-10%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter:'blur(50px)' }} />
  </div>
);

export default function CandidateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user: authUser, loading: authLoading } = useAuth();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playingVideo, setPlayingVideo] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser || authUser.role !== 'Coach') {
      router.push('/login');
      return;
    }

    const fetchCandidate = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/coach/candidates/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (data.success) {
          setCandidate(data.data);
        } else {
          setError(data.error || 'Failed to load candidate');
        }
      } catch (err) {
        setError('Failed to load candidate details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchCandidate();
  }, [authUser, authLoading, params.id, router]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-12 h-12 border-2 border-var(--primary) border-opacity-20 border-t-var(--primary) rounded-full animate-spin" />
      <p className="text-var(--text-muted) text-sm font-medium animate-pulse">Retrieving Mentee Profile...</p>
    </div>
  );

  if (error || !candidate) return (
    <div className="max-w-4xl mx-auto p-8 text-center space-y-6 pt-20">
      <BackgroundGrid />
      <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400">
        <ArrowLeft size={32} />
      </div>
      <h2 className="serif text-3xl text-var(--text-primary)">Profile Unavailable</h2>
      <p className="text-var(--text-muted) max-w-sm mx-auto">{error || 'This candidate profile could not be retrieved at this time.'}</p>
      <button onClick={() => router.back()} className="px-8 py-3 rounded-xl bg-var(--card-bg) border border-var(--card-border) text-var(--text-primary) font-bold hover:bg-var(--primary-glow) transition-all">
        Return to Directory
      </button>
    </div>
  );

  return (
    <div className="relative max-w-[1400px] mx-auto pb-24 px-4 sm:px-6 lg:px-8 pt-10 animate-in fade-in duration-700 font-['DM_Sans',sans-serif]">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          backdrop-filter: blur(24px);
          border-radius: 28px;
          box-shadow: var(--shadow-lg);
        }
        .section-label {
          font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 12px; display: block;
        }
        .btn-premium {
          display:flex; align-items:center; justify-content:center; gap:10px;
          padding:14px 28px; border-radius:18px; font-weight:700;
          font-size:14px; cursor:pointer; border:none;
          background: var(--primary);
          color:#fff; box-shadow: 0 8px 25px var(--primary-glow);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-premium:hover { transform: translateY(-2px); box-shadow: 0 12px 35px var(--primary-glow); }
        .btn-outline {
          display:flex; align-items:center; justify-content:center; gap:10px;
          padding:14px 28px; border-radius:18px; font-weight:700;
          font-size:14px; cursor:pointer;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          color: var(--text-primary);
          transition: all 0.3s;
        }
        .btn-outline:hover { background: var(--primary-glow); border-color: var(--primary); }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
        <div className="space-y-4">
          <Link href="/coach/candidates" className="inline-flex items-center gap-2 text-xs font-bold text-var(--primary) uppercase tracking-widest hover:opacity-80 transition-all">
            <ArrowLeft size={14} /> Back to Directory
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-var(--card-bg) border-4 border-var(--primary) border-opacity-20 shadow-2xl flex items-center justify-center shrink-0">
              {candidate.avatarUrl ? (
                <img src={candidate.avatarUrl} alt={candidate.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-var(--text-muted)">👤</span>
              )}
            </div>
            <div>
              <h1 className="serif text-4xl sm:text-5xl lg:text-6xl text-var(--text-primary) font-medium tracking-tight">{candidate.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <p className="text-var(--text-muted) font-light flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {candidate.email}
                </p>
                {candidate.phone && (
                  <p className="text-var(--text-muted) font-light">• {candidate.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {candidate.profile?.videoUrl && (
            <button onClick={() => setPlayingVideo(true)} className="btn-outline flex-1 lg:flex-none">
              <Play size={18} className="text-rose-500" /> Watch Intro
            </button>
          )}
          <button className="btn-premium flex-1 lg:flex-none">
            <MessageSquare size={18} /> Send Message
          </button>
          <button className="btn-outline flex-1 lg:flex-none">
            <Calendar size={18} /> Schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Professional Context */}
          <div className="glass-card p-8 sm:p-10">
            <h3 className="serif text-2xl text-var(--text-primary) mb-8 flex items-center gap-3 border-b border-var(--card-border) pb-6">
              <span className="w-10 h-10 bg-var(--primary-glow) rounded-xl flex items-center justify-center text-var(--primary)"><Briefcase size={20} /></span>
              Career Foundation
            </h3>

            {candidate.profile ? (
              <div className="space-y-10">
                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <label className="section-label">Current Role</label>
                    <p className="text-var(--text-primary) font-bold text-lg">{candidate.profile.occupation || 'Exploring Opportunities'}</p>
                  </div>
                  <div>
                    <label className="section-label">Education</label>
                    <p className="text-var(--text-primary) font-bold text-lg flex items-center gap-2">
                      <GraduationCap size={18} className="text-var(--primary)" /> {candidate.profile.education || 'Self-Taught'}
                    </p>
                  </div>
                  <div>
                    <label className="section-label">Experience</label>
                    <p className="text-var(--text-primary) font-bold text-lg">{candidate.profile.experience || 0} Years</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-var(--card-border)">
                  <div>
                    <label className="section-label">Location</label>
                    <p className="text-var(--text-primary) font-medium flex items-center gap-2">
                      <MapPin size={16} className="text-rose-500" /> {candidate.profile.location || 'Sweden (Remote)'}
                    </p>
                  </div>
                  <div>
                    <label className="section-label">Target Industries</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {candidate.profile.industryPreferences?.map(ind => (
                        <span key={ind} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20 uppercase tracking-widest">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-var(--card-border)">
                  <label className="section-label">Professional Narrative</label>
                  <p className="text-var(--text-secondary) leading-relaxed italic bg-var(--primary-glow) p-6 rounded-2xl border border-var(--primary) border-opacity-10 text-lg">
                    "{candidate.profile.about || 'This candidate has not provided a bio yet.'}"
                  </p>
                </div>

                <div className="pt-8 border-t border-var(--card-border)">
                  <label className="section-label">Expertise & Attributes</label>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {candidate.profile.skills?.map(skill => (
                      <span key={skill} className="px-4 py-2 bg-var(--primary-glow) text-var(--primary) text-xs font-bold rounded-xl border border-var(--primary) border-opacity-20 uppercase tracking-wider">
                        {skill}
                      </span>
                    ))}
                    {candidate.profile.strengths?.map(s => (
                      <span key={s} className="px-4 py-2 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-xl border border-indigo-500/20">
                        ✨ {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-var(--primary-glow) bg-opacity-5 rounded-3xl border-2 border-dashed border-var(--card-border)">
                <Shield size={48} className="mx-auto mb-4 text-var(--text-muted) opacity-20" />
                <p className="text-var(--text-muted) font-light">Comprehensive profile data is pending candidate submission.</p>
              </div>
            )}
          </div>

          {/* Activity Stream */}
          <div className="glass-card p-8 sm:p-10">
            <h3 className="serif text-2xl text-var(--text-primary) mb-8">Program Activity</h3>
            <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-var(--card-border)">
              {candidate.recentActivity?.length > 0 ? (
                candidate.recentActivity.map((act, i) => (
                  <div key={i} className="flex gap-6 relative z-10">
                    <div className={`w-4 h-4 rounded-full border-4 border-var(--background) shrink-0 mt-1 shadow-lg ${act.type === 'session' ? 'bg-var(--primary)' : 'bg-emerald-500'}`} />
                    <div className="flex-1 p-5 rounded-2xl bg-var(--primary-glow) bg-opacity-30 border border-var(--card-border) hover:border-var(--primary) transition-all">
                      <p className="text-sm font-bold text-var(--text-primary)">{act.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock size={12} className="text-var(--text-muted)" />
                        <p className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest">
                          {new Date(act.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-var(--text-muted) text-sm font-light italic ml-8">No activity logged in the current cycle.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Growth Progress */}
          <div className="glass-card p-8 text-center overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-var(--primary-glow) blur-[60px] opacity-50" />
            <label className="section-label mb-8">Program Completion</label>
            <div className="relative h-48 w-48 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-var(--card-border) opacity-50" />
                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552.92} strokeDashoffset={552.92 * (1 - (candidate.progress || 0) / 100)} className="text-var(--primary) transition-all duration-1000 ease-out" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 8px var(--primary-glow))' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-var(--text-primary) tracking-tighter">{(candidate.progress || 0)}%</span>
                <span className="text-[10px] font-bold text-var(--primary) uppercase tracking-[0.2em] mt-1">Growth</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-var(--primary-glow) rounded-2xl border border-var(--card-border)">
                <p className="text-[10px] font-bold text-var(--text-muted) uppercase mb-1">Sessions</p>
                <p className="text-lg font-black text-var(--text-primary)">{candidate.sessionsAttended || 0}</p>
              </div>
              <div className="p-4 bg-var(--primary-glow) rounded-2xl border border-var(--card-border)">
                <p className="text-[10px] font-bold text-var(--text-muted) uppercase mb-1">Portfolio</p>
                <p className="text-lg font-black text-var(--text-primary)">{candidate.documentsSubmitted || 0}</p>
              </div>
            </div>
          </div>

          {/* Document Vault */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="serif text-xl text-var(--text-primary)">Shared Files</h3>
              <span className="text-[10px] font-bold bg-var(--primary-glow) border border-var(--primary) border-opacity-20 px-2.5 py-1 rounded-lg text-var(--primary)">{candidate.documents?.length || 0}</span>
            </div>
            <div className="space-y-4">
              {candidate.documents?.length > 0 ? (
                candidate.documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-var(--primary-glow) bg-opacity-20 border border-var(--card-border) hover:border-var(--primary) transition-all group cursor-pointer">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-var(--card-bg) flex items-center justify-center text-var(--primary) border border-var(--card-border)"><FileText size={20} /></div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-var(--text-primary) truncate">{doc.fileName}</p>
                        <p className="text-[10px] text-var(--text-muted) font-medium uppercase">{doc.fileType || 'Document'}</p>
                      </div>
                    </div>
                    <Download size={16} className="text-var(--primary) opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-30">
                  <FileText size={32} className="mx-auto mb-3" />
                  <p className="text-xs font-medium">Vault Empty</p>
                </div>
              )}
            </div>
            <button className="btn-outline w-full mt-8 py-4 text-xs uppercase tracking-widest">
              Manage Vault
            </button>
          </div>
        </div>
      </div>

      {/* Video Overlay Modal */}
      {playingVideo && candidate.profile?.videoUrl && (
        <div 
          className="fixed inset-0 z-[200] bg-var(--background) bg-opacity-90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-500"
          onClick={() => setPlayingVideo(false)}
        >
          <div 
            className="relative w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-6 right-6 z-10">
              <button 
                onClick={() => setPlayingVideo(false)} 
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all text-xl font-bold border border-white/20"
              >
                ✕
              </button>
            </div>
            <video 
              src={candidate.profile.videoUrl} 
              controls 
              autoPlay 
              className="w-full h-auto aspect-video object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
