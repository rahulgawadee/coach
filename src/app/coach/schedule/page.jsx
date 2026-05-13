"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import apiService from '@/services/api';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Link as LinkIcon,
  FileText,
  AlertCircle,
  CheckCircle2,
  List,
  Grid
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
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square bg-var(--card-bg) opacity-30 rounded-xl sm:rounded-2xl border border-transparent" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySessions = schedule.filter(s => s.date === dateStr);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div key={day} className={`aspect-square p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all group relative overflow-hidden flex flex-col ${isToday ? 'bg-var(--primary-glow) border-var(--primary) shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' : 'bg-var(--card-bg) border-transparent hover:bg-var(--primary-glow) hover:border-var(--primary-glow)'}`}>
          <div className="flex justify-between items-start">
            <span className={`text-[10px] sm:text-xs md:text-sm font-bold leading-none ${isToday ? 'text-var(--primary)' : 'text-var(--text-muted)'}`}>{day}</span>
            {daySessions.length > 0 && (
              <span className="xs:hidden w-1 h-1 rounded-full bg-var(--primary)" />
            )}
          </div>
          <div className="mt-1 flex-1 space-y-0.5 sm:space-y-1 overflow-y-auto no-scrollbar hidden xs:block">
            {daySessions.slice(0, 3).map((s, idx) => (
              <div key={idx} className="px-1 py-0.5 bg-var(--primary-glow) border border-var(--primary) text-var(--primary) text-[8px] sm:text-[9px] font-medium rounded-md truncate w-full">
                {s.time?.split(' - ')[0] || s.time}
              </div>
            ))}
            {daySessions.length > 3 && (
              <div className="text-[7px] sm:text-[8px] text-var(--text-muted) font-bold px-1">+{daySessions.length - 3} more</div>
            )}
          </div>
          <button 
            onClick={() => {
              setNewSession({...newSession, date: dateStr});
              setShowAddModal(true);
            }}
            className="absolute bottom-2 right-2 w-6 h-6 bg-var(--primary) text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:opacity-80 shadow-lg z-10"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl sm:text-2xl font-medium text-var(--text-primary) serif">{monthNames[month]} {year}</h2>
            <div className="flex gap-1.5 p-1 bg-var(--card-bg) rounded-xl border border-var(--card-border) shrink-0">
              <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1.5 text-var(--text-muted) hover:text-var(--text-primary) hover:bg-var(--primary-glow) rounded-lg transition-colors"><ChevronLeft size={16} /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold text-var(--text-secondary) rounded-lg hover:bg-var(--primary-glow) transition-colors uppercase tracking-widest">Today</button>
              <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1.5 text-var(--text-muted) hover:text-var(--text-primary) hover:bg-var(--primary-glow) rounded-lg transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="flex bg-var(--card-bg) p-1 rounded-xl border border-transparent">
            <button onClick={() => setViewMode('month')} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-var(--primary-glow) text-var(--primary) border border-transparent shadow-sm' : 'text-var(--text-muted) border border-transparent'}`}><Grid size={14} /> Month</button>
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold rounded-lg uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-var(--primary-glow) text-var(--primary) border border-transparent shadow-sm' : 'text-var(--text-muted) border border-transparent'}`}><List size={14} /> List View</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center pb-2 sm:pb-3 text-[8px] sm:text-[10px] font-bold text-var(--text-muted) uppercase tracking-[0.1em] sm:tracking-[0.2em] border-b border-var(--card-border) mb-1 sm:mb-2">
              <span className="hidden md:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
              <span className="md:hidden">{d}</span>
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  if (loading && schedule.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid var(--primary-glow)', borderTop:'1.5px solid var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const InputClass = "w-full p-3 sm:p-4 rounded-2xl bg-var(--input-bg) border border-transparent outline-none text-var(--text-primary) placeholder-var(--text-muted) focus:border-var(--primary) focus:ring-2 focus:ring-var(--primary-glow) transition-all text-sm shadow-sm";

  return (
    <div className="relative max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
      <BackgroundGrid />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-card {
          background: var(--card-bg);
          border-radius: 32px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
          backdrop-filter: blur(24px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-premium {
          background: var(--primary);
          color: white;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center; gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px var(--primary-glow);
        }
        .btn-premium:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px var(--primary-glow);
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
          transition: all 0.2s;
        }
        .btn-outline-premium:hover { background: var(--primary-glow); border-color: var(--primary); }

        @media (max-width: 1024px) {
          .glass-card { padding: 1.75rem !important; }
        }
        @media (max-width: 768px) {
          .glass-card { border-radius: 24px !important; padding: 1.5rem !important; }
          .serif { font-size: clamp(2rem, 8vw, 3rem) !important; }
        }
        @media (max-width: 480px) {
          .glass-card { padding: 1.25rem !important; border-radius: 20px !important; }
          .btn-premium, .btn-outline-premium { width: 100%; font-size: 13px; padding: 12px 16px; border-radius: 12px; }
        }
        @media (max-width: 360px) {
          .glass-card { padding: 1rem !important; }
        }
      `}</style>

      <div className="space-y-8 px-4 sm:px-0">
        <div className="pt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-var(--primary-glow) border border-var(--primary) text-var(--primary) text-[10px] font-bold uppercase tracking-widest mb-4">
              <CalendarIcon size={12} />
              Session Manager
            </div>
            <h1 className="serif text-4xl sm:text-5xl text-var(--text-primary) font-medium tracking-tight">Calendar</h1>
            <p className="text-var(--text-muted) font-light mt-2 max-w-md">Orchestrate your mentorship sessions and manage availability in one fluid interface.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button className="btn-outline-premium flex-1 sm:flex-none justify-center" onClick={() => {}}>🚫 Block</button>
            <button className="btn-premium flex-1 sm:flex-none justify-center" onClick={() => setShowAddModal(true)}><Plus size={18} /> New Session</button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8">
          <div className="xl:col-span-3 order-2 xl:order-1">
            <div className="glass-card p-6 sm:p-10">
              {viewMode === 'month' ? renderCalendar() : (
                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-medium text-var(--text-primary) serif">Upcoming Sessions</h2>
                      <button onClick={() => setViewMode('month')} className="text-[10px] font-bold text-var(--primary) uppercase tracking-widest hover:opacity-80 transition-colors">Calendar View</button>
                   </div>
                   <div className="grid sm:grid-cols-2 gap-4">
                     {schedule.length > 0 ? schedule.map((s, idx) => (
                       <div key={idx} className="p-6 rounded-2xl bg-var(--card-bg) border border-var(--card-border) hover:border-var(--primary) transition-all group">
                         <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-var(--primary-glow) rounded-xl flex flex-col items-center justify-center border border-var(--primary) border-opacity-20 text-var(--primary)">
                               <span className="text-[9px] font-bold uppercase tracking-tighter leading-none mb-1">{new Date(s.date).toLocaleString('default', { month: 'short' })}</span>
                               <span className="text-lg font-black leading-none">{new Date(s.date).getDate()}</span>
                            </div>
                            <span className="px-2 py-1 rounded-md bg-var(--primary-glow) border border-var(--primary) border-opacity-20 text-[9px] font-bold text-var(--primary) uppercase tracking-widest">
                              {s.sessionType}
                            </span>
                         </div>
                         <div>
                            <p className="font-bold text-var(--text-primary) group-hover:text-var(--primary) transition-colors">{s.candidateName}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-var(--text-muted) font-medium">
                              <span className="flex items-center gap-1.5"><Clock size={13} /> {s.time}</span>
                            </div>
                         </div>
                       </div>
                     )) : (
                       <div className="col-span-full py-20 text-center border border-dashed border-var(--card-border) rounded-3xl bg-var(--primary-glow) bg-opacity-5">
                         <CalendarIcon size={40} className="mx-auto mb-4 text-var(--text-muted)" />
                         <p className="text-var(--text-muted) font-medium italic">Your schedule is currently clear.</p>
                       </div>
                     )}
                   </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div className="glass-card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-var(--text-primary) uppercase tracking-widest">Requests</h3>
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-2.5 py-1 rounded-full font-bold">{pendingRequests.length}</span>
              </div>
              <div className="space-y-4">
                {pendingRequests.length > 0 ? pendingRequests.map((r, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold">
                        {r.candidateName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-var(--text-primary) truncate">{r.candidateName}</p>
                        <p className="text-[10px] font-medium text-var(--text-muted) uppercase mt-0.5">{r.date} • {r.time}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button className="py-2 bg-amber-500 text-amber-950 text-[10px] font-bold rounded-lg hover:opacity-80 transition-colors shadow-lg shadow-amber-500/20">Approve</button>
                      <button className="py-2 bg-var(--card-bg) text-var(--text-muted) text-[10px] font-bold rounded-lg border border-var(--card-border) hover:bg-var(--primary-glow) transition-colors">Decline</button>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center opacity-40">
                    <CheckCircle2 size={32} className="mx-auto mb-3 text-var(--text-muted)" />
                    <p className="text-var(--text-muted) text-xs">No pending requests.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Session Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
             <div className="relative bg-var(--background) border border-var(--card-border) rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-12 max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6 sm:mb-10">
                  <h2 className="text-2xl sm:text-3xl font-medium text-var(--text-primary) serif tracking-tight">Schedule Session</h2>
                  <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-var(--primary-glow) text-var(--text-muted) transition-colors"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleAddSession} className="space-y-8">
                   <div className="space-y-4">
                     <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest block">Select Mentees</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-4 bg-var(--primary-glow) rounded-2xl border border-var(--card-border) no-scrollbar">
                       {candidates.length > 0 ? candidates.map(candidate => (
                         <button
                           key={candidate.candidateId}
                           type="button"
                           onClick={() => toggleCandidateSelection(candidate.candidateId)}
                           className={`p-3.5 rounded-xl text-left transition-all border flex items-center gap-3 ${
                             newSession.candidateUserIds.includes(candidate.candidateId)
                               ? 'bg-var(--primary-glow) border-var(--primary) text-var(--text-primary) shadow-lg'
                               : 'bg-var(--card-bg) border-transparent text-var(--text-muted) hover:bg-var(--primary-glow)'
                           }`}
                         >
                           <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                              newSession.candidateUserIds.includes(candidate.candidateId) ? 'bg-var(--primary) text-white shadow-lg shadow-var(--primary-glow)' : 'bg-var(--card-bg) text-var(--text-muted)'
                           }`}>
                             {candidate.candidateName.charAt(0)}
                           </div>
                           <span className="font-bold text-sm truncate">{candidate.candidateName}</span>
                         </button>
                       )) : <p className="text-var(--text-muted) text-xs p-4 italic">No active candidates in your network.</p>}
                     </div>
                     <p className="text-[10px] text-var(--primary) font-bold px-2 uppercase tracking-tighter">
                       {newSession.candidateUserIds.length} candidate(s) selected
                     </p>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest block">Session Date</label>
                        <input type="date" className={InputClass} value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest block">Start Time</label>
                        <input type="time" className={InputClass} value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} required />
                      </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest block">Session Format</label>
                     <select 
                      className={`${InputClass} appearance-none cursor-pointer`}
                      value={newSession.sessionType}
                      onChange={e => setNewSession({...newSession, sessionType: e.target.value})}
                     >
                       <option className="bg-var(--background) text-var(--text-primary)">Coaching</option>
                       <option className="bg-var(--background) text-var(--text-primary)">CV Review</option>
                       <option className="bg-var(--background) text-var(--text-primary)">Interview Prep</option>
                       <option className="bg-var(--background) text-var(--text-primary)">Workshop</option>
                     </select>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-4 pt-6">
                     <button type="submit" className="btn-premium flex-1 py-4 text-base justify-center" disabled={loading}>
                       {loading ? 'Processing...' : 'Schedule Session'}
                     </button>
                     <button type="button" className="btn-outline-premium flex-1 py-4 text-base justify-center" onClick={() => setShowAddModal(false)}>Discard</button>
                   </div>
                </form>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
