'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';

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
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error || !candidate) return (
    <div className="max-w-4xl mx-auto p-8">
      <Button variant="ghost" onClick={() => router.back()}>← Back</Button>
      <Card className="mt-4 p-8 text-center text-red-600 border-red-100 bg-red-50">
        {error || 'Candidate not found'}
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link href="/coach/dashboard" className="text-sm font-bold text-blue-600 uppercase tracking-widest hover:underline mb-2 block">
            ← Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-md flex items-center justify-center shrink-0">
              {candidate.avatarUrl ? (
                <img src={candidate.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-slate-400">👤</span>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900">{candidate.name}</h1>
              <p className="text-slate-500 mt-1">{candidate.email} • {candidate.phone || 'No phone'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto mt-4 md:mt-0">
          {candidate.profile?.videoUrl && (
            <Button variant="outline" onClick={() => setPlayingVideo(true)} className="flex-1 md:flex-none py-3 px-6 rounded-2xl font-black border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              ▶ Watch Intro
            </Button>
          )}
          <Button variant="primary" className="flex-1 md:flex-none py-3 px-8 rounded-2xl font-black shadow-lg shadow-blue-200">
            💬 Message
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none py-3 px-8 rounded-2xl font-black">
            📅 Schedule
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Professional Profile */}
        <div className="lg:col-span-2 space-y-8">
          {/* Detailed Profile Card */}
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-sm">👤</span>
              Professional Profile
            </h3>

            {candidate.profile ? (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Occupation</p>
                      <p className="text-slate-900 font-bold text-lg">{candidate.profile.occupation || 'Not Specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Education Level</p>
                      <p className="text-slate-900 font-bold">{candidate.profile.education || 'Not Specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Years of Experience</p>
                      <p className="text-slate-900 font-bold">{candidate.profile.experience} Years</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                      <p className="text-slate-900 font-bold">{candidate.profile.location || 'Sweden'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Desired Industry</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {candidate.profile.industryPreferences?.map(ind => (
                          <span key={ind} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100">
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">About Candidate</p>
                  <p className="text-slate-600 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    "{candidate.profile.about || 'No summary provided.'}"
                  </p>
                </div>

                {candidate.profile.videoUrl && (
                  <div className="pt-8 border-t border-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Video Introduction
                    </p>
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video relative shadow-lg">
                      <video className="w-full h-full object-contain" controls src={candidate.profile.videoUrl} />
                    </div>
                  </div>
                )}

                <div className="pt-8 border-t border-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Skills & Strengths</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.profile.skills?.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl border border-blue-100">
                        {skill}
                      </span>
                    ))}
                    {candidate.profile.strengths?.map(s => (
                      <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl border border-indigo-100">
                        ✨ {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400">Profile data not yet completed by candidate.</p>
              </div>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
            <h3 className="text-xl font-black text-slate-900 mb-8">Recent Activity</h3>
            <div className="space-y-6">
              {candidate.recentActivity?.length > 0 ? (
                candidate.recentActivity.map((act, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-2 mt-1.5 h-2 rounded-full shrink-0 ${act.type === 'session' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{act.message}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {new Date(act.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No recent activity found.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Progress & Docs */}
        <div className="space-y-8">
          {/* Progress Card */}
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 text-center">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Program Progress</h3>
            <div className="relative h-40 w-40 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={464.95} strokeDashoffset={464.95 * (1 - candidate.progress / 100)} className="text-blue-600 transition-all duration-1000" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">{candidate.progress}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Sessions</p>
                <p className="text-sm font-black text-slate-900">{candidate.sessionsAttended}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Docs</p>
                <p className="text-sm font-black text-slate-900">{candidate.documentsSubmitted}</p>
              </div>
            </div>
          </Card>

          {/* Shared Documents */}
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Documents</h3>
              <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded-lg text-slate-500">{candidate.documents?.length || 0}</span>
            </div>
            <div className="space-y-3">
              {candidate.documents?.length > 0 ? (
                candidate.documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📄</span>
                      <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{doc.fileName}</span>
                    </div>
                    <span className="text-blue-600 opacity-0 group-hover:opacity-100 text-xs font-bold">⬇</span>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-slate-400 text-xs">No documents shared yet.</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-6 py-4 rounded-2xl font-bold border-2 text-xs">
              📂 Manage Files
            </Button>
          </Card>
        </div>
      </div>

      {/* Video Overlay Modal */}
      {playingVideo && candidate.profile?.videoUrl && (
        <div 
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setPlayingVideo(false)}
        >
          <div 
            className="relative w-full max-w-4xl bg-black/50 border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button 
                onClick={() => setPlayingVideo(false)} 
                className="w-10 h-10 rounded-full bg-black/50 border border-white/20 text-white flex items-center justify-center hover:bg-white/10 backdrop-blur-md transition-all font-bold"
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
