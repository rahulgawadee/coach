'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import apiService from '@/services/api';

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
    candidateUserIds: [], // Now an array for multi-select
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
      setError('Failed to load dashboard data');
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
      days.push(<div key={`empty-${i}`} className="h-32 border border-slate-50 bg-slate-50/50 rounded-xl" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySessions = schedule.filter(s => s.date === dateStr);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      days.push(
        <div key={day} className={`h-32 border border-slate-100 p-2 rounded-2xl transition-all hover:shadow-md group relative ${isToday ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : 'bg-white'}`}>
          <span className={`text-sm font-black ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{day}</span>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-20 scrollbar-hide">
            {daySessions.map((s, idx) => (
              <div key={idx} className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg truncate shadow-sm">
                {s.time?.split(' - ')[0] || s.time} {s.candidateName}
              </div>
            ))}
          </div>
          <button 
            onClick={() => {
              setNewSession({...newSession, date: dateStr});
              setShowAddModal(true);
            }}
            className="absolute bottom-2 right-2 w-6 h-6 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white font-black"
          >
            +
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900">{monthNames[month]} {year}</h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">←</button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">Today</button>
              <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">→</button>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('month')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Month</button>
            <button onClick={() => setViewMode('week')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>List</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-4 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Schedule Manager</h1>
          <p className="text-slate-500 mt-1">Manage your sessions, availability, and multi-candidate bookings.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setShowBlockModal(true)}>🚫 Block Time</Button>
          <Button variant="primary" className="rounded-2xl font-black shadow-lg shadow-blue-200" onClick={() => setShowAddModal(true)}>+ New Session</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
            {viewMode === 'month' ? renderCalendar() : (
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900">Upcoming Sessions</h2>
                    <button onClick={() => setViewMode('month')} className="text-xs font-bold text-blue-600 uppercase tracking-widest">Switch to Calendar</button>
                 </div>
                 <div className="space-y-4">
                   {schedule.map((s, idx) => (
                     <div key={idx} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm border border-slate-100">
                            <span className="text-[10px] font-black text-blue-600 uppercase leading-none">{new Date(s.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-lg font-black text-slate-900 leading-none">{new Date(s.date).getDate()}</span>
                         </div>
                         <div>
                           <p className="font-bold text-slate-900">{s.candidateName}</p>
                           <p className="text-xs text-slate-500 font-medium">{s.time} • {s.sessionType}</p>
                         </div>
                       </div>
                       <div className="flex gap-2">
                         <Button variant="ghost" className="text-xs py-1.5 h-auto">Edit</Button>
                         <Button variant="outline" className="text-xs py-1.5 h-auto text-red-600 hover:bg-red-50 border-red-100">Cancel</Button>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-6 border-none shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center justify-between">
              Requests
              <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-lg">{pendingRequests.length}</span>
            </h3>
            <div className="space-y-4">
              {pendingRequests.length > 0 ? pendingRequests.map((r, i) => (
                <div key={i} className="p-4 rounded-2xl bg-amber-50 border border-amber-100 space-y-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{r.candidateName}</p>
                    <p className="text-[10px] font-bold text-amber-700 uppercase">{r.date} • {r.time}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-blue-600 text-white text-[10px] font-black rounded-lg shadow-sm">Approve</button>
                    <button className="flex-1 py-2 bg-white text-slate-600 text-[10px] font-black rounded-lg border border-slate-200">Decline</button>
                  </div>
                </div>
              )) : (
                <p className="text-center py-6 text-slate-400 text-sm">No pending requests.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Session Modal with Multi-Select */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
           <div className="fixed inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
           <div className="relative bg-white rounded-[3rem] shadow-2xl p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Schedule New Session</h2>
              
              <form onSubmit={handleAddSession} className="space-y-8">
                 {/* Multi-Select Candidates */}
                 <div>
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 block">Select Candidates (Multi-Select)</label>
                   <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-3xl border border-slate-100">
                     {candidates.map(candidate => (
                       <button
                         key={candidate.candidateId}
                         type="button"
                         onClick={() => toggleCandidateSelection(candidate.candidateId)}
                         className={`p-4 rounded-2xl text-left transition-all border-2 flex items-center gap-3 ${
                           newSession.candidateUserIds.includes(candidate.candidateId)
                             ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                             : 'bg-white border-transparent text-slate-600 hover:border-blue-100'
                         }`}
                       >
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            newSession.candidateUserIds.includes(candidate.candidateId) ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
                         }`}>
                           {candidate.candidateName.charAt(0)}
                         </div>
                         <span className="font-bold text-xs truncate">{candidate.candidateName}</span>
                       </button>
                     ))}
                   </div>
                   <p className="text-[10px] text-slate-400 mt-2 font-bold px-2 italic">
                     Selected: {newSession.candidateUserIds.length} candidate(s)
                   </p>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
                      <input type="date" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold focus:ring-2 focus:ring-blue-500 transition-all" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} required />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Start Time</label>
                      <input type="time" className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold focus:ring-2 focus:ring-blue-500 transition-all" value={newSession.startTime} onChange={e => setNewSession({...newSession, startTime: e.target.value})} required />
                    </div>
                 </div>

                 <div>
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Session Type</label>
                   <select 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold"
                    value={newSession.sessionType}
                    onChange={e => setNewSession({...newSession, sessionType: e.target.value})}
                   >
                     <option>Coaching</option>
                     <option>CV Review</option>
                     <option>Interview Prep</option>
                     <option>Workshop</option>
                   </select>
                 </div>

                 <Button type="submit" variant="primary" className="w-full py-5 rounded-2xl font-black mt-4 shadow-xl shadow-blue-200 text-lg" disabled={loading}>
                   {loading ? 'Scheduling...' : '✓ Schedule Session'}
                 </Button>
                 <Button variant="ghost" className="w-full text-slate-400 font-bold" onClick={() => setShowAddModal(false)}>Discard and Close</Button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
