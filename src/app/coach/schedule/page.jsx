'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import apiService from '@/services/api';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#06060f 0%,#090912 50%,#07070e 100%)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#38bdf8" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
  </div>
);

export default function SchedulePage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [schedule, setSchedule] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('month'); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const [blockData, setBlockData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: 'Time Off',
    recurring: false,
  });
  
  const [newSession, setNewSession] = useState({
    candidateUserIds: [], 
    date: '',
    startTime: '',
    endTime: '',
    sessionType: 'Coaching',
    meetingLink: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [scheduleRes, candidatesRes] = await Promise.all([
        fetch('/api/coach/schedule', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        apiService.coach.getActiveCandidates()
      ]);

      const scheduleData = await scheduleRes.json();
      if (scheduleData.success) {
        setSchedule(scheduleData.schedule?.confirmedSessions || []);
        setPendingRequests(scheduleData.schedule?.pendingRequests || []);
      }

      if (candidatesRes.success) {
        setCandidates(candidatesRes.candidates || []);
      }
    } catch (err) {
      setError('Failed to load schedule data');
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
    fetchData();
  }, [authUser, authLoading, authToken, router]);

  const toggleCandidateSelection = (candidateId) => {
    setNewSession(prev => {
      const isSelected = prev.candidateUserIds.includes(candidateId);
      const newIds = isSelected 
        ? prev.candidateUserIds.filter(id => id !== candidateId)
        : [...prev.candidateUserIds, candidateId];
      return { ...prev, candidateUserIds: newIds };
    });
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-white/5 bg-white/5 rounded-2xl" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySessions = schedule.filter(s => s.date === dateStr);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div key={day} className={`h-32 p-2 rounded-2xl transition-all group relative overflow-hidden flex flex-col ${isToday ? 'bg-sky-900/30 border border-sky-500/50 shadow-[inset_0_0_20px_rgba(14,165,233,0.15)]' : 'bg-white/5 border border-white/10 hover:border-white/20'}`}>
          <span className={`text-sm font-bold ml-1 ${isToday ? 'text-sky-400' : 'text-slate-400'}`}>{day}</span>
          <div className="mt-1 flex-1 space-y-1 overflow-y-auto scrollbar-hide pr-1">
            {daySessions.map((s, idx) => (
              <div key={idx} className="px-1.5 py-1 bg-sky-500/20 border border-sky-500/30 text-sky-100 text-[10px] font-medium rounded-lg truncate w-full">
                {s.time?.split(' - ')[0] || s.time} {s.candidateName}
              </div>
            ))}
          </div>
          <button 
            onClick={() => {
              setNewSession({...newSession, date: dateStr});
              setShowAddModal(true);
            }}
            className="absolute bottom-2 right-2 w-6 h-6 bg-sky-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-sky-400 font-black shadow-lg"
          >
            +
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-medium text-white serif">{monthNames[month]} {year}</h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">←</button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-colors">Today</button>
              <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">→</button>
            </div>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button onClick={() => setViewMode('month')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'month' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm' : 'text-slate-400 border border-transparent'}`}>Month</button>
            <button onClick={() => setViewMode('week')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'week' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-sm' : 'text-slate-400 border border-transparent'}`}>List</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{d}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    if (newSession.candidateUserIds.length === 0) {
      alert('Please select at least one candidate.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/coach/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSession),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewSession({
          candidateUserIds: [],
          date: '',
          startTime: '',
          endTime: '',
          sessionType: 'Coaching',
          meetingLink: '',
          notes: '',
        });
        fetchData();
      }
    } catch (err) {
      setError('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  if (loading && schedule.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(14,165,233,0.15)', borderTop:'1.5px solid #0ea5e9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const InputClass = "w-full p-4 rounded-xl bg-white/5 border border-white/10 outline-none text-white placeholder-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all";

  return (
    <div className="relative max-w-7xl mx-auto pb-16 animate-in fade-in duration-500">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
        .page-root { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .card {
          background: rgba(255,255,255,0.028);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .card:hover { border-color: rgba(255,255,255,0.11); box-shadow: 0 12px 40px rgba(0,0,0,0.35); }
        .btn-primary {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:14px 24px; border-radius:14px; font-weight:600;
          font-size:14px; letter-spacing:0.02em; cursor:pointer; border:none;
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color:#fff; box-shadow: 0 4px 20px rgba(2,132,199,0.25);
          transition: box-shadow 0.25s, transform 0.2s;
        }
        .btn-primary:hover { box-shadow: 0 8px 30px rgba(2,132,199,0.38); transform:translateY(-1px); }
        .btn-ghost {
          display:flex; align-items:center; justify-content:center; gap:8px;
          width:100%; padding:14px 24px; border-radius:14px; font-weight:600;
          font-size:14px; cursor:pointer;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.85);
          transition: background 0.2s, border-color 0.2s;
        }
        .btn-ghost:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.18); }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .delay-1 { animation-delay:0.07s; }
        .delay-2 { animation-delay:0.14s; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="page-root space-y-8 px-4 sm:px-0">
        <div className="fade-up pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="serif text-4xl text-white font-medium tracking-tight mb-2">Schedule Manager</h1>
            <p className="text-slate-400 font-light">Manage your sessions, availability, and multi-candidate bookings.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="btn-ghost" onClick={() => setShowBlockModal(true)}>🚫 Block Time</button>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ New Session</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8 fade-up delay-1">
          <div className="lg:col-span-3">
            <div className="card p-8">
              {viewMode === 'month' ? renderCalendar() : (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-medium text-white serif">Upcoming Sessions</h2>
                      <button onClick={() => setViewMode('month')} className="text-xs font-bold text-sky-400 uppercase tracking-widest hover:text-sky-300">Switch to Calendar</button>
                   </div>
                   <div className="space-y-4">
                     {schedule.length > 0 ? schedule.map((s, idx) => (
                       <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                         <div className="flex items-center gap-5">
                           <div className="w-14 h-14 bg-sky-900/40 rounded-xl flex flex-col items-center justify-center border border-sky-800 text-sky-400 shadow-inner">
                              <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">{new Date(s.date).toLocaleString('default', { month: 'short' })}</span>
                              <span className="text-xl font-black leading-none">{new Date(s.date).getDate()}</span>
                           </div>
                           <div>
                             <p className="font-bold text-white">{s.candidateName}</p>
                             <p className="text-xs text-slate-400 font-medium mt-1">{s.time} • {s.sessionType}</p>
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <button className="btn-ghost" style={{ padding: '8px 16px', width: 'auto' }}>Edit</button>
                           <button className="btn-ghost" style={{ padding: '8px 16px', width: 'auto', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>Cancel</button>
                         </div>
                       </div>
                     )) : (
                       <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                         <p className="text-slate-500 font-medium">No upcoming sessions.</p>
                       </div>
                     )}
                   </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="card p-6">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center justify-between">
                Requests
                <span className="bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] px-2 py-1 rounded-lg">{pendingRequests.length}</span>
              </h3>
              <div className="space-y-4">
                {pendingRequests.length > 0 ? pendingRequests.map((r, i) => (
                  <div key={i} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div>
                      <p className="text-sm font-bold text-white">{r.candidateName}</p>
                      <p className="text-[10px] font-bold text-amber-400/80 uppercase mt-1">{r.date} • {r.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-amber-500 text-amber-950 text-[10px] font-bold rounded-lg hover:bg-amber-400 transition-colors">Approve</button>
                      <button className="flex-1 py-2 bg-transparent text-slate-400 text-[10px] font-bold rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors">Decline</button>
                    </div>
                  </div>
                )) : (
                  <p className="text-center py-6 text-slate-500 text-sm">No pending requests.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Session Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
             <div className="fixed inset-0 bg-[#06060f]/80 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
             <div className="relative bg-[#0d0c1e] border border-white/10 rounded-3xl shadow-2xl p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-3xl font-medium text-white serif mb-8 tracking-tight">Schedule Session</h2>
                
                <form onSubmit={handleAddSession} className="space-y-8">
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">Select Candidates (Multi-Select)</label>
                     <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 bg-[#06060f] rounded-2xl border border-white/5">
                       {candidates.length > 0 ? candidates.map(candidate => (
                         <button
                           key={candidate.candidateId}
                           type="button"
                           onClick={() => toggleCandidateSelection(candidate.candidateId)}
                           className={`p-3 rounded-xl text-left transition-all border flex items-center gap-3 ${
                             newSession.candidateUserIds.includes(candidate.candidateId)
                               ? 'bg-sky-500/20 border-sky-500/50 text-white shadow-lg shadow-sky-900/20'
                               : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10'
                           }`}
                         >
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              newSession.candidateUserIds.includes(candidate.candidateId) ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                           }`}>
                             {candidate.candidateName.charAt(0)}
                           </div>
                           <span className="font-medium text-sm truncate">{candidate.candidateName}</span>
                         </button>
                       )) : <p className="text-slate-500 text-sm p-2">No active candidates available.</p>}
                     </div>
                     <p className="text-[10px] text-slate-500 mt-2 font-medium px-2 italic">
                       Selected: {newSession.candidateUserIds.length} candidate(s)
                     </p>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
                        <input type="date" className={InputClass} value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} required />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Start Time</label>
                        <input type="time" className={InputClass} value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} required />
                      </div>
                   </div>

                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Session Type</label>
                     <select 
                      className={`${InputClass} appearance-none`}
                      value={newSession.sessionType}
                      onChange={e => setNewSession({...newSession, sessionType: e.target.value})}
                     >
                       <option className="bg-[#0d0c1e] text-white">Coaching</option>
                       <option className="bg-[#0d0c1e] text-white">CV Review</option>
                       <option className="bg-[#0d0c1e] text-white">Interview Prep</option>
                       <option className="bg-[#0d0c1e] text-white">Workshop</option>
                     </select>
                   </div>

                   <div className="flex gap-4 pt-4">
                     <button type="submit" className="btn-primary flex-1 py-4 text-base" disabled={loading}>
                       {loading ? 'Scheduling...' : '✓ Schedule Session'}
                     </button>
                     <button type="button" className="btn-ghost flex-1 py-4 text-base text-slate-300" onClick={() => setShowAddModal(false)}>Cancel</button>
                   </div>
                </form>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
