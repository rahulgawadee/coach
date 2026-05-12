'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Clock, BookOpen, AlertCircle, X, Check, Lock, Video } from 'lucide-react';

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

export default function CandidateCalendarPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [coachAvailability, setCoachAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [req, setReq] = useState({ preferredDate: '', preferredTime: '', topic: '', message: '' });
  const [coachName, setCoachName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState('month');

  useEffect(() => setMounted(true), []);

  const fetchCalendar = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/candidate/calendar?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.data.events || []);
        setCoachAvailability(data.data.coachAvailability || []);
        setCoachName(data.data.coachName || 'Your Coach');
      }
    } catch (err) {
      console.error('Calendar fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
      return;
    }
    fetchCalendar();
    const interval = setInterval(fetchCalendar, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, router]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { email: user.email, ...req };
      const res = await fetch('/api/candidate/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setShowRequestModal(false);
        fetchCalendar();
        setReq({ preferredDate: '', preferredTime: '', topic: '', message: '' });
        alert('Request sent to coach');
      } else {
        alert(data.error || 'Failed to send request');
      }
    } catch (err) {
      console.error('Request error', err);
      alert('Failed to send request');
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();



  if (loading && !events.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(99,102,241,0.15)', borderTop:'1.5px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!mounted) return null;

  const times = [];
  for (let h = 8; h <= 18; h++) times.push(`${String(h).padStart(2, '0')}:00`);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-16 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
      <BackgroundGrid />
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .glass-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(24px);
          border-radius: 24px;
        }
        .btn-ghost {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: 12px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #e2e8f0; transition: all 0.2s;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); color: #fff; }
        .btn-primary {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 14px;
          font-size: 13px; font-weight: 700; cursor: pointer; border: none;
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: #fff; box-shadow: 0 4px 16px rgba(99,102,241,0.25);
          transition: all 0.25s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(99,102,241,0.38); }
        
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease; padding: 16px;
        }
        .modal-content {
          background: #0f0e1c; border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 24px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1);
          border-radius: 24px; width: 100%; max-width: 480px;
          animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
          max-height: 90vh; overflow-y: auto;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        
        .input-dark {
          width: 100%; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
          padding: 12px 16px; color: #fff; font-size: 14px; outline: none;
          transition: all 0.2s; font-family: inherit;
        }
        .input-dark:focus { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.03); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .input-dark::placeholder { color: rgba(255,255,255,0.2); }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @media (max-width: 767px) {
          .calendar-grid { 
            display: grid !important;
            grid-template-columns: repeat(7, minmax(0, 1fr)) !important; 
            gap: 2px !important;
            width: 100% !important;
          }
          .calendar-day, .empty-day { 
            min-width: 0 !important;
            height: auto !important; 
            aspect-ratio: 1 / 1 !important; 
            min-height: 50px !important;
            padding: 4px !important;
            border-radius: 8px !important;
            border: none !important;
            background: transparent !important;
          }
          .serif { font-size: 1.5rem !important; }
          .glass-card { padding: 0.75rem !important; border-radius: 12px; }
          .calendar-header-day { font-size: 7px !important; padding-bottom: 2px !important; }
        }
        
        @media (max-width: 400px) {
          .calendar-grid { gap: 1px !important; }
          .calendar-day, .empty-day { padding: 2px !important; min-height: 50px !important; }
        }
      `}</style>

      {/* Header */}
      <div className="glass-card p-6 sm:p-8 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-4">
            <CalendarDays size={12} />
            Schedule Manager
          </div>
          <h1 className="serif text-3xl md:text-4xl text-white leading-tight mb-2">Program Calendar</h1>
          <p className="text-slate-400 font-light text-sm sm:text-base">Manage your sessions with <span className="text-indigo-300 font-medium">{coachName}</span></p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button className="btn-primary w-full md:w-auto justify-center" onClick={() => setShowRequestModal(true)}>
            <Plus size={16} /> New Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card p-4 sm:p-8">
        {viewMode === 'month' ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <h2 className="text-xl sm:text-2xl font-medium text-white serif">
                  {new Date(currentDate.getFullYear(), currentDate.getMonth()).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-1">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
                  <button onClick={() => setCurrentDate(new Date())} className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-colors">Today</button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><ChevronRight size={18} /></button>
                </div>
              </div>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
                <button onClick={() => setViewMode('month')} className={`flex-1 sm:flex-none px-4 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${viewMode === 'month' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-slate-400 border border-transparent'}`}>Calendar</button>
                <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none px-4 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-slate-400 border border-transparent'}`}>List</button>
              </div>
            </div>

            <div className="calendar-grid grid grid-cols-7 gap-1 sm:gap-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="calendar-header-day text-center py-2 text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{d}</div>
              ))}
              
              {/* Empty cells */}
              {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => (
                <div key={`empty-${i}`} className="empty-day h-24 sm:h-36 bg-white/5 rounded-xl sm:rounded-2xl" />
              ))}

              {/* Days in Month */}
              {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = events.filter(e => e.date === dateStr);
                const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                const isBlocked = coachAvailability.some(a => a.date === dateStr && a.blocked);

                return (
                  <div key={day} className={`calendar-day h-24 sm:h-36 p-1 sm:p-3 rounded-xl sm:rounded-2xl transition-all group relative overflow-hidden flex flex-col ${isToday ? 'bg-indigo-900/30 shadow-[inset_0_0_20px_rgba(99,102,241,0.15)]' : 'bg-white/5 hover:bg-white/[0.08]'}`}>
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] sm:text-sm font-bold ml-1 ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>{day}</span>
                      {isBlocked && <Lock size={10} className="text-slate-600 mt-0.5 sm:mt-1 mr-0.5 sm:mr-1" />}
                    </div>
                    <div className="mt-1 flex-1 space-y-0.5 sm:space-y-1 overflow-y-auto pr-0.5 sm:pr-1 no-scrollbar">
                      {dayEvents.map((ev, idx) => (
                        <div 
                          key={idx} 
                          className={`px-1 py-0.5 sm:px-1.5 sm:py-1 text-[7px] sm:text-[10px] font-bold truncate w-full ${
                            ev.status === 'confirmed' 
                              ? 'text-emerald-400' 
                              : 'text-amber-400'
                          }`}
                          title={`${ev.time} - ${ev.title}`}
                        >
                          <span className="hidden sm:inline">{ev.time} </span>{ev.title}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        setReq({...req, preferredDate: dateStr});
                        setShowRequestModal(true);
                      }}
                      className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 h-6 bg-indigo-500 text-white rounded-md sm:rounded-lg flex items-center justify-center opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-indigo-400 font-black shadow-lg z-10"
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-medium text-white serif">Upcoming Sessions</h2>
                <button onClick={() => setViewMode('month')} className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300">Switch to Calendar</button>
             </div>
             <div className="space-y-3 sm:space-y-4">
               {events.filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0)).sort((a,b) => new Date(a.date) - new Date(b.date)).length > 0 ? 
                events.filter(e => new Date(e.date) >= new Date().setHours(0,0,0,0)).sort((a,b) => new Date(a.date) - new Date(b.date)).map((ev, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all gap-4">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-900/40 rounded-xl flex flex-col items-center justify-center border border-indigo-800 text-indigo-400 shadow-inner shrink-0">
                         <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest leading-none mb-1">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                         <span className="text-lg sm:text-xl font-black leading-none">{new Date(ev.date).getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm sm:text-base truncate">{ev.title}</p>
                        <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1">{ev.time} • {ev.topic || 'General'}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${ev.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-tighter ${ev.status === 'confirmed' ? 'text-emerald-400' : 'text-amber-400'}`}>{ev.status}</span>
                        </div>
                      </div>
                    </div>
                    {ev.status === 'confirmed' && (
                      <div className="flex gap-2">
                        <button className="btn-ghost w-full sm:w-auto justify-center text-xs" style={{ padding: '8px 16px' }}>Join Meeting</button>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl">
                    <p className="text-slate-500 font-medium text-sm">No upcoming sessions.</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 sm:gap-6 px-4">
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500" /> Confirmed
        </div>
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-500" /> Pending
        </div>
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <Lock size={10} /> Coach Unavailable
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/5 bg-white/[0.01]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Video size={18} className="text-indigo-400" />
                  Request Session
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Propose a time to your coach.</p>
              </div>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleRequestSubmit}>
              <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Date</label>
                    <input 
                      type="date" 
                      value={req.preferredDate} 
                      onChange={(e) => setReq({ ...req, preferredDate: e.target.value })} 
                      className="input-dark" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Time</label>
                    <select 
                      value={req.preferredTime} 
                      onChange={(e) => setReq({ ...req, preferredTime: e.target.value })} 
                      className="input-dark"
                      required
                    >
                      <option value="" className="bg-[#0f0e1c]">Select Time</option>
                      {times.map(t => (
                        <option key={t} value={t} className="bg-[#0f0e1c]">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Focus Topic</label>
                  <input 
                    placeholder="e.g. CV Review, Interview Prep"
                    value={req.topic} 
                    onChange={(e) => setReq({ ...req, topic: e.target.value })} 
                    className="input-dark" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Note (Optional)</label>
                  <textarea 
                    placeholder="What would you like to achieve in this session?"
                    value={req.message} 
                    onChange={(e) => setReq({ ...req, message: e.target.value })} 
                    className="input-dark h-24 resize-none" 
                  />
                </div>

                <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mt-2">
                  <AlertCircle size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] sm:text-[11.5px] text-indigo-200/80 leading-relaxed font-light">
                    Your session is only confirmed once your coach accepts.
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row justify-end gap-3">
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn-ghost w-full sm:w-auto justify-center">
                  Cancel
                </button>
                <button type="submit" className="btn-primary w-full sm:w-auto justify-center">
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
