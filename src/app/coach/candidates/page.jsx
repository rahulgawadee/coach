'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import apiService from '@/services/api';

const AvatarCell = ({ name, avatarUrl, size = 56 }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="relative shrink-0">
      <div style={{ width: size, height: size }} className="rounded-2xl overflow-hidden bg-var(--primary-glow) border border-var(--primary) shadow-lg">
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-var(--primary) font-bold" style={{ fontSize: size * 0.35 }}>
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
      </div>
    </div>
  );
};

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'var(--background)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="var(--primary)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter:'blur(40px)' }} />
  </div>
);

export default function CandidatesPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  const fetchCandidates = async () => {
    try {
      const response = await apiService.coach.getCandidates();
      if (response.success) {
        setCandidates(response.data || []);
      } else {
        setError(response.error || 'Failed to load candidates');
      }
    } catch (err) {
      console.error('Candidates error:', err);
      setError('Failed to load candidates. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!authUser || authUser.role !== 'Coach') {
      router.push('/login');
      return;
    }
    fetchCandidates();
  }, [authUser, authLoading, router]);

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid var(--primary-glow)', borderTop:'1.5px solid var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto pb-16 animate-in fade-in duration-500">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
        .page-root { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .card {
          background: var(--card-bg);
          border-radius: 32px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
          backdrop-filter: blur(24px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }
        .card:hover { border-color: var(--primary-glow); box-shadow: 0 20px 40px -10px var(--primary-glow); transform: translateY(-2px); }
        .pill {
          display:inline-flex; align-items:center; gap:6px;
          padding: 5px 12px; border-radius:999px;
          font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase;
        }
        .btn-primary {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:10px 16px; border-radius:12px; font-weight:600;
          font-size:13px; letter-spacing:0.01em; cursor:pointer; border:none;
          background: var(--primary);
          color:#fff; box-shadow: 0 4px 20px var(--primary-glow);
          transition: box-shadow 0.25s, transform 0.2s;
        }
        .btn-primary:hover { box-shadow: 0 8px 30px var(--primary-glow); transform:translateY(-1px); }
        .btn-ghost {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:10px 16px; border-radius:12px; font-weight:600;
          font-size:13px; cursor:pointer;
          background: var(--card-bg);
          border: 1px solid transparent;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .btn-ghost:hover { background: var(--primary-glow); color: var(--primary); }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .delay-1 { animation-delay:0.07s; }
        .delay-2 { animation-delay:0.14s; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="page-root space-y-8">
        {/* Header */}
        <div className="fade-up pt-8 px-4 sm:px-0">
          <Link href="/coach/dashboard" className="text-xs font-bold text-var(--primary) uppercase tracking-widest hover:opacity-80 transition-colors mb-4 inline-block">
            ← Dashboard
          </Link>
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-end gap-6">
            <div className="text-center sm:text-left">
              <h1 className="serif text-3xl sm:text-4xl md:text-5xl text-var(--text-primary) font-medium tracking-tight mb-2">Mentee Directory</h1>
              <p className="text-var(--text-muted) font-light text-sm sm:text-base">You have <span className="text-var(--text-primary) font-medium">{candidates.length}</span> candidates in your network.</p>
            </div>
            
            <div className="w-full lg:w-80 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-var(--text-muted)">🔍</span>
              <input 
                type="text" 
                placeholder="Search candidates..." 
                className="w-full pl-12 pr-4 py-3 bg-var(--input-bg) border border-transparent rounded-2xl focus:ring-2 focus:ring-var(--primary-glow) focus:border-var(--primary) outline-none text-var(--text-primary) placeholder-var(--text-muted) transition-all font-medium text-sm sm:text-base shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="fade-up delay-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-4 sm:px-0">
          <div className="flex bg-var(--card-bg) p-1 rounded-xl border border-var(--card-border) overflow-x-auto no-scrollbar">
            {['all', 'accepted', 'completed', 'paused'].map(status => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 sm:px-5 py-2 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === status ? 'bg-var(--primary-glow) text-var(--primary) border border-var(--primary) shadow-sm' : 'text-var(--text-muted) hover:text-var(--text-primary) border border-transparent'}`}
              >
                {status}
              </button>
            ))}
          </div>
          <button className="btn-ghost sm:w-auto" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Export (CSV)</button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="fade-up card p-6 border-rose-500/20 bg-rose-500/10 text-rose-400 font-medium text-center">
            {error}
          </div>
        )}

        {/* Grid Layout */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 fade-up delay-2 px-4 sm:px-0">
          {filteredCandidates.length > 0 ? filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="card p-6 group">
              <div className="flex items-start justify-between mb-5">
                <AvatarCell name={candidate.name} avatarUrl={candidate.avatarUrl} size={56} />
                <span className={`pill ${
                  candidate.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-var(--primary-glow) text-var(--text-muted) border border-var(--card-border)'
                }`}>
                  {candidate.status}
                </span>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-var(--text-primary) group-hover:text-var(--primary) transition-colors">{candidate.name}</h3>
                  <p className="text-sm text-var(--text-secondary) font-medium mt-0.5">{candidate.email}</p>
                  {candidate.occupation && (
                    <p className="text-xs text-var(--text-muted) mt-1">🏢 {candidate.occupation}</p>
                  )}
                </div>
                {candidate.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0, 4).map(skill => (
                      <span key={skill} className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-var(--primary) bg-var(--primary-glow) border border-var(--primary) rounded-md">{skill}</span>
                    ))}
                    {candidate.skills.length > 4 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold text-var(--text-muted) bg-var(--card-bg) rounded-md">+{candidate.skills.length - 4}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link href={`/coach/candidates/${candidate.candidateId}`} className="flex-1">
                  <button className="btn-primary w-full">Profile</button>
                </Link>
                <button className="btn-ghost flex-1">Message</button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center border border-dashed border-var(--card-border) rounded-3xl bg-var(--card-bg)">
              <p className="text-var(--text-muted) font-medium text-sm">No candidates match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
