'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';

export default function CandidateCalendarPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [view, setView] = useState('week'); // 'week' or 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [coachAvailability, setCoachAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [req, setReq] = useState({ preferredDate: '', preferredTime: '', topic: '', message: '' });
  const [coachName, setCoachName] = useState('');

  // Generate week dates based on currentDate
  const weekDates = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
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
    const interval = setInterval(fetchCalendar, 60000); // Refresh every minute
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
        fetchCalendar(); // Reload all data
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
    return events.filter(ev => ev.date === dateStr && ev.time === time);
  };

  const isTimeBlocked = (date, time) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    // Check if coach has explicitly blocked this time in CoachAvailability
    return coachAvailability.some(a => a.date === dateStr && a.startTime <= time && a.endTime > time && a.blocked);
  };

  const navigateWeek = (direction) => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(next);
  };

  if (loading && !events.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header Area */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your sessions with <span className="font-bold text-blue-600">{coachName}</span></p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-xl border border-gray-200">
          <button 
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"
          >
            ←
          </button>
          <div className="px-4 font-bold text-gray-700 min-w-[200px] text-center">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <button 
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"
          >
            →
          </button>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="primary" onClick={() => setShowRequestModal(true)}>+ New Session</Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Days Header */}
            <div className="grid grid-cols-6 border-b border-gray-100 bg-gray-50/50">
              <div className="p-4 border-r border-gray-100" />
              {weekDates.map((date) => (
                <div key={date.toString()} className={`p-4 text-center border-r border-gray-100 last:border-r-0 ${date.toDateString() === new Date().toDateString() ? 'bg-blue-50/50' : ''}`}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <p className={`text-xl font-black mt-1 ${date.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="divide-y divide-gray-50">
              {times.map((time) => (
                <div key={time} className="grid grid-cols-6 group">
                  <div className="p-4 border-r border-gray-100 text-right">
                    <span className="text-xs font-bold text-gray-400 group-hover:text-blue-600 transition-colors">{time}</span>
                  </div>
                  
                  {weekDates.map((date) => {
                    const cellEvents = getEventsForCell(date, time);
                    const blocked = isTimeBlocked(date, time);
                    const isToday = date.toDateString() === new Date().toDateString();

                    return (
                      <div 
                        key={`${date}-${time}`} 
                        className={`p-1.5 border-r border-gray-100 last:border-r-0 min-h-[80px] relative transition-colors ${blocked ? 'bg-gray-50/50' : 'hover:bg-blue-50/30'} ${isToday ? 'bg-blue-50/10' : ''}`}
                      >
                        {blocked && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                            <div className="w-full h-px bg-gray-300 rotate-45" />
                          </div>
                        )}

                        {cellEvents.map((ev) => (
                          <div 
                            key={ev.id} 
                            className={`rounded-xl p-2.5 mb-1.5 shadow-sm border-l-4 animate-in zoom-in duration-200 cursor-pointer hover:shadow-md transition-all
                              ${ev.status === 'confirmed' ? 'bg-green-50 border-green-500 text-green-900' : 
                                ev.status === 'requested' ? 'bg-amber-50 border-amber-500 text-amber-900' : 
                                'bg-gray-50 border-gray-400 text-gray-900'}`}
                          >
                            <div className="font-bold text-[11px] leading-tight mb-1 truncate">{ev.title}</div>
                            <div className="flex items-center gap-1.5 opacity-70">
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              <span className="text-[10px] font-bold uppercase">{ev.status}</span>
                            </div>
                            {ev.topic && (
                              <div className="text-[10px] mt-1.5 font-medium opacity-60 italic">"{ev.topic}"</div>
                            )}
                          </div>
                        ))}

                        {!blocked && cellEvents.length === 0 && (
                          <button 
                            onClick={() => {
                              setReq(p => ({ ...p, preferredDate: date.toISOString().split('T')[0], preferredTime: time }));
                              setShowRequestModal(true);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 flex items-center justify-center"
                          >
                            <span className="text-2xl text-blue-300">+</span>
                          </button>
                        )}
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
      <div className="flex gap-6 px-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
          <span className="h-3 w-3 rounded-full bg-green-500" /> Confirmed
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
          <span className="h-3 w-3 rounded-full bg-amber-500" /> Pending Approval
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
          <span className="h-3 w-3 rounded bg-gray-100 border border-gray-200" /> Coach Unavailable
        </div>
      </div>

      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Coaching Session"
        actions={[
          { label: 'Cancel', variant: 'outline', onClick: () => setShowRequestModal(false) },
          { label: 'Send Request', variant: 'primary', onClick: handleRequestSubmit },
        ]}
      >
        <div className="space-y-6 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Date</label>
              <input 
                type="date" 
                value={req.preferredDate} 
                onChange={(e) => setReq({ ...req, preferredDate: e.target.value })} 
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none" 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Time</label>
              <select 
                value={req.preferredTime} 
                onChange={(e) => setReq({ ...req, preferredTime: e.target.value })} 
                className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Select Time</option>
                {times.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Focus Topic</label>
            <input 
              placeholder="e.g. CV Review, Interview Prep"
              value={req.topic} 
              onChange={(e) => setReq({ ...req, topic: e.target.value })} 
              className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none" 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Note for Coach (Optional)</label>
            <textarea 
              placeholder="Tell your coach what you'd like to achieve in this session..."
              value={req.message} 
              onChange={(e) => setReq({ ...req, message: e.target.value })} 
              className="w-full border-2 border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 focus:outline-none h-24 resize-none" 
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 leading-relaxed">
            <strong>Note:</strong> Your session is only confirmed once your coach accepts the request. You will see it turn green on the calendar when approved.
          </div>
        </div>
      </Modal>
    </div>
  );
}
