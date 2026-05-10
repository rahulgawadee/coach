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

  useEffect(() => setMounted(true), []);

  const weekDates = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));
    
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [currentDate]);

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

  const times = useMemo(() => {
    const t = [];
    for (let h = 8; h <= 18; h++) t.push(`${String(h).padStart(2, '0')}:00`);
    return t;
  }, []);

  const getEventsForCell = (date, time) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const cellHour = time.split(':')[0];
    return events.filter(ev => {
      if (ev.date !== dateStr) return false;
      if (ev.time === time) return true;
      return ev.time && ev.time.split(':')[0] === cellHour;
    });
  };

  const isTimeBlocked = (date, time) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    return coachAvailability.some(a => a.date === dateStr && a.startTime <= time && a.endTime > time && a.blocked);
  };

  const navigateWeek = (direction) => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(next);
  };

  if (loading && !events.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(99,102,241,0.15)', borderTop:'1.5px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="relative max-w-7xl mx-auto pb-16 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
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
        .cal-header {
          display: flex; flex-direction: column; gap: 24px;
          padding: 32px 36px;
        }
        @media(min-width: 768px) {
          .cal-header { flex-direction: row; align-items: center; justify-content: space-between; }
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
        .nav-group {
          display: flex; align-items: center; gap: 8px;
          background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);
          padding: 4px; border-radius: 14px;
        }
        .nav-btn {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.6); cursor: pointer; background: transparent; border: none;
          transition: all 0.2s;
        }
        .nav-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .cal-grid {
          display: grid; grid-template-columns: 70px repeat(5, 1fr);
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .cal-cell {
          border-right: 1px solid rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.03);
          min-height: 90px; padding: 6px; position: relative;
          transition: background 0.2s;
        }
        .cal-cell:last-child { border-right: none; }
        .cal-cell:hover .add-btn { opacity: 1; transform: scale(1); }
        .add-btn {
          position: absolute; inset: 0; margin: auto;
          width: 32px; height: 32px; border-radius: 10px;
          background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
          color: #a5b4fc; display: flex; align-items: center; justify-content: center;
          opacity: 0; transform: scale(0.9); transition: all 0.2s; cursor: pointer; z-index: 5;
        }
        .add-btn:hover { background: rgba(99,102,241,0.25); color: #fff; transform: scale(1.05); }
        
        .event-pill {
          padding: 8px 10px; border-radius: 10px;
          font-size: 11px; margin-bottom: 6px;
          position: relative; overflow: hidden; z-index: 10; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          border-left: 3px solid transparent;
        }
        .event-pill:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .ev-confirmed { background: rgba(16,185,129,0.1); border-left-color: #10b981; border: 1px solid rgba(16,185,129,0.15); border-left-width: 3px; color: #a7f3d0; }
        .ev-requested { background: rgba(245,158,11,0.1); border-left-color: #f59e0b; border: 1px solid rgba(245,158,11,0.15); border-left-width: 3px; color: #fde68a; }
        
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease; padding: 20px;
        }
        .modal-content {
          background: #0f0e1c; border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 24px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1);
          border-radius: 24px; width: 100%; max-width: 480px;
          animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1);
          overflow: hidden;
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
        .input-dark::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div className="glass-card cal-header mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-4">
            <CalendarDays size={12} />
            Schedule Manager
          </div>
          <h1 className="serif text-3xl md:text-4xl text-white leading-tight mb-2">Program Calendar</h1>
          <p className="text-slate-400 font-light">Manage your sessions with <span className="text-indigo-300 font-medium">{coachName}</span></p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="nav-group">
            <button onClick={() => navigateWeek(-1)} className="nav-btn"><ChevronLeft size={18} /></button>
            <div className="px-4 text-[13px] font-semibold text-slate-200 min-w-[160px] text-center tracking-wide">
              {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <button onClick={() => navigateWeek(1)} className="nav-btn"><ChevronRight size={18} /></button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <button className="btn-ghost flex-1 sm:flex-none justify-center" onClick={() => setCurrentDate(new Date())}>Today</button>
            <button className="btn-primary flex-1 sm:flex-none justify-center" onClick={() => setShowRequestModal(true)}>
              <Plus size={16} /> New Session
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Days Header */}
            <div className="cal-grid bg-white/[0.01]">
              <div className="p-4" /> {/* Time column empty header */}
              {weekDates.map((date) => {
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div key={date.toString()} className={`p-4 text-center border-r border-white/5 last:border-r-0 ${isToday ? 'bg-indigo-500/10' : ''}`}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={`text-2xl font-black ${isToday ? 'text-indigo-400' : 'text-slate-200'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div>
              {times.map((time) => (
                <div key={time} className="cal-grid group">
                  <div className="p-4 border-r border-white/5 text-right relative">
                    <span className="text-[10px] font-bold text-slate-600 tracking-wider group-hover:text-indigo-400 transition-colors block -mt-2">
                      {time}
                    </span>
                  </div>
                  
                  {weekDates.map((date) => {
                    const cellEvents = getEventsForCell(date, time);
                    const blocked = isTimeBlocked(date, time);
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                      <div 
                        key={`${date}-${time}`} 
                        className={`cal-cell ${isToday ? 'bg-indigo-500/[0.02]' : ''}`}
                      >
                        {blocked ? (
                          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-sm">
                            <div className="w-full h-full" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)' }} />
                            <div className="absolute inset-0 flex items-center justify-center opacity-50"><Lock size={16} /></div>
                          </div>
                        ) : (
                          cellEvents.length === 0 && (
                            <button 
                              className="add-btn"
                              onClick={() => {
                                setReq({ ...req, preferredDate: date.toISOString().split('T')[0], preferredTime: time });
                                setShowRequestModal(true);
                              }}
                            >
                              <Plus size={16} />
                            </button>
                          )
                        )}

                        {cellEvents.map((ev) => (
                          <div key={ev.id} className={`event-pill ${ev.status === 'confirmed' ? 'ev-confirmed' : 'ev-requested'}`}>
                            <div className="font-bold text-[11.5px] leading-tight mb-1 truncate text-white">{ev.time} - {ev.title}</div>
                            <div className="flex items-center gap-1.5 opacity-80 mb-1.5">
                              {ev.status === 'confirmed' ? <Check size={10} /> : <Clock size={10} />}
                              <span className="text-[9px] font-bold uppercase tracking-wider">{ev.status}</span>
                            </div>
                            {ev.topic && (
                              <div className="text-[10px] font-medium opacity-70 italic truncate flex items-center gap-1">
                                <BookOpen size={10} className="shrink-0" /> {ev.topic}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-6 px-4">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Confirmed
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> Pending Approval
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span className="w-4 h-4 rounded-[4px] border border-white/10 flex items-center justify-center opacity-50">
            <div className="w-full h-full rounded-[3px]" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 6px)' }} />
          </span> Blocked / Unavailable
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.01]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Video size={18} className="text-indigo-400" />
                  Request Session
                </h3>
                <p className="text-xs text-slate-400 mt-1">Propose a time to your coach.</p>
              </div>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleRequestSubmit}>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Date</label>
                    <input 
                      type="date" 
                      value={req.preferredDate} 
                      onChange={(e) => setReq({ ...req, preferredDate: e.target.value })} 
                      className="input-dark" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Time</label>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Focus Topic</label>
                  <input 
                    placeholder="e.g. CV Review, Interview Prep"
                    value={req.topic} 
                    onChange={(e) => setReq({ ...req, topic: e.target.value })} 
                    className="input-dark" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Note (Optional)</label>
                  <textarea 
                    placeholder="What would you like to achieve in this session?"
                    value={req.message} 
                    onChange={(e) => setReq({ ...req, message: e.target.value })} 
                    className="input-dark h-24 resize-none" 
                  />
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mt-2">
                  <AlertCircle size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11.5px] text-indigo-200/80 leading-relaxed font-light">
                    Your session is only confirmed once your coach accepts. You will see it turn green on the calendar when approved.
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-white/[0.01] flex justify-end gap-3">
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
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
