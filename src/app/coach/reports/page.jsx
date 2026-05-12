"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import apiService from '@/services/api';
import { 
  BarChart3, 
  FileDown, 
  Search, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen,
  ChevronRight,
  Filter
} from 'lucide-react';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#06060f 0%,#090912 50%,#07070e 100%)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
        <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#0ea5e9" strokeWidth="0.5"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
  </div>
);

export default function ReportsPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/login');
      return;
    }

    const fetchCandidates = async () => {
      try {
        const data = await apiService.coach.getActiveCandidates();
        setCandidates(data.data || []);
      } catch (err) {
        console.error('Candidates error:', err);
        if (err.message === 'Unauthorized') {
          router.push('/login');
          return;
        }
        setError('Failed to load candidates');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [isAuthenticated, hasRole, authToken, router]);

  const handleGenerateReport = async (e) => {
    e.preventDefault();

    if (!selectedCandidate || !startDate || !endDate) {
      setError('Please select all fields');
      return;
    }

    setGeneratingReport(true);
    setError('');

    try {
      const data = await apiService.coach.getReports(selectedCandidate, startDate, endDate);
      setReport(data.report);
    } catch (err) {
      console.error('Report generation error:', err);
      setError('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;

    const headers = ['Date', 'Type', 'Duration (min)', 'Notes'];
    const rows = report.sessionHistory.map((session) => [
      session.date,
      session.type,
      session.duration,
      session.notes || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${selectedCandidate}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(14,165,233,0.15)', borderTop:'1.5px solid #0ea5e9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const InputClass = "w-full p-4 rounded-xl bg-white/5 border border-white/10 outline-none text-white placeholder-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all text-sm appearance-none";

  return (
    <div className="relative max-w-6xl mx-auto pb-16 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          border-radius: 28px;
        }
        .btn-premium {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center; gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(2,132,199,0.25);
        }
        .btn-premium:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(2,132,199,0.35); }
      `}</style>

      {/* Header */}
      <div className="pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4 sm:px-0">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-bold uppercase tracking-widest mb-4">
            <BarChart3 size={12} />
            Performance Analytics
          </div>
          <h1 className="serif text-4xl sm:text-5xl text-white font-medium tracking-tight">Outcome Reports</h1>
          <p className="text-slate-400 font-light mt-2 max-w-md">Generate detailed analytics and compliance reports for individual mentees.</p>
        </div>
      </div>

      {error && (
        <div className="mt-8 mx-4 sm:mx-0 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Filter Form */}
      <div className="mt-10 mx-4 sm:mx-0 glass-card p-8 sm:p-10">
        <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-2">
          <Filter size={16} className="text-sky-500" />
          Report Configuration
        </h2>
        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Select Mentee</label>
            <div className="relative">
              <select required value={selectedCandidate} onChange={(e) => setSelectedCandidate(e.target.value)} className={InputClass}>
                <option value="" className="bg-[#0d0c1e]">Choose Candidate</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id} className="bg-[#0d0c1e]">{candidate.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"><ChevronRight size={14} className="rotate-90" /></div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Start Date</label>
            <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={InputClass} />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">End Date</label>
            <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className={InputClass} />
          </div>

          <div className="flex items-end">
            <button type="submit" disabled={generatingReport} className="btn-premium w-full justify-center py-4">
              {generatingReport ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : 'Generate Insight'}
            </button>
          </div>
        </form>
      </div>

      {/* Report Display */}
      {report && (
        <div className="mt-8 space-y-8 px-4 sm:px-0">
          {/* Report Header */}
          <div className="glass-card p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8" style={{ background:'linear-gradient(135deg,rgba(14,165,233,0.05) 0%,transparent 100%)' }}>
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 text-sky-400 font-bold mb-2">
                <CheckCircle2 size={18} /> Validated Outcome
              </div>
              <h2 className="serif text-3xl sm:text-4xl text-white font-medium">{report.candidateName}</h2>
              <p className="text-slate-400 font-light mt-2">Period: <span className="text-white font-medium">{report.startDate}</span> — <span className="text-white font-medium">{report.endDate}</span></p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4 flex items-center gap-1.5 justify-center sm:justify-start">
                <Shield size={12} /> Compliance: Government Standard 102A
              </p>
            </div>
            <button onClick={handleExportCSV} className="btn-premium px-8 py-4 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20">
              <FileDown size={20} /> Export Audit (CSV)
            </button>
          </div>

          {/* Progress Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-card p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4"><Clock size={28} /></div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Attendance Rate</p>
              <p className="text-3xl font-black text-white">{report.attendance || 0}%</p>
            </div>
            <div className="glass-card p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4"><BookOpen size={28} /></div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assignment Load</p>
              <p className="text-3xl font-black text-white">{report.assignmentsCompleted || 0}%</p>
            </div>
            <div className="glass-card p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4"><TrendingUp size={28} /></div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Overall Growth</p>
              <p className="text-3xl font-black text-white">{report.overallProgress || 0}%</p>
            </div>
          </div>

          {/* Session History */}
          <div className="glass-card overflow-hidden">
            <div className="p-8 sm:p-10 border-b border-white/5 flex items-center justify-between">
              <h3 className="serif text-2xl text-white">Session Audit Trail</h3>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500"><Search size={18} /></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/[0.02] text-left">
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Format</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Duration</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Outcome Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {report.sessionHistory.map((session, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 text-sm font-bold text-white">{session.date}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {session.type}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-400 text-center font-medium">{session.duration} min</td>
                      <td className="px-8 py-6 text-sm text-slate-500 italic font-light max-w-xs truncate">{session.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Shield({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}
