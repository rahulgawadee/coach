'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import apiService from '@/services/api';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link href="/coach/dashboard" className="text-sm font-bold text-blue-600 uppercase tracking-widest hover:underline mb-2 block">
            ← Dashboard
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mentee Directory</h1>
          <p className="text-slate-500 mt-1">You have {candidates.length} candidates in your network.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-80">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="Search by name..." 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm focus:border-blue-500 outline-none transition-all font-bold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {['all', 'accepted', 'completed', 'paused'].map(status => (
            <button 
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-6 py-2 text-xs font-black rounded-lg uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {status}
            </button>
          ))}
        </div>
        <Button variant="outline" className="rounded-xl font-black text-xs py-3">Export Directory (CSV)</Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-6 border-red-100 bg-red-50 text-red-600 font-bold text-center">
          {error}
        </Card>
      )}

      {/* Grid Layout */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.length > 0 ? filteredCandidates.map((candidate) => (
          <Card key={candidate.id} className="p-6 border-none shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black">
                {candidate.name.charAt(0)}
              </div>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                candidate.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {candidate.status}
              </span>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{candidate.name}</h3>
                <p className="text-sm text-slate-400 font-bold">{candidate.email}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${candidate.progress}%` }} />
                </div>
                <span className="text-[10px] font-black text-slate-700">{candidate.progress}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link href={`/coach/candidates/${candidate.candidateId}`} className="flex-1">
                <Button variant="primary" className="w-full py-3 rounded-xl font-black text-xs shadow-lg shadow-blue-100">Profile</Button>
              </Link>
              <Button variant="outline" className="flex-1 py-3 rounded-xl font-black text-xs">Message</Button>
            </div>
          </Card>
        )) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
            <p className="text-slate-400 font-black text-lg uppercase tracking-widest">No candidates found</p>
          </div>
        )}
      </div>
    </div>
  );
}
