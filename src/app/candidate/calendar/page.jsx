'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function CandidateCalendarPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [view, setView] = useState('week');
  const [weekStart, setWeekStart] = useState(null);
  const [events, setEvents] = useState([]);
  const [coachAvailability, setCoachAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [req, setReq] = useState({ preferredDate: '', preferredTime: '', topic: '', message: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchCalendar = async () => {
      setLoading(true);
      try {
        const email = user?.email;
        const res = await fetch(`/api/candidate/calendar?email=${encodeURIComponent(email)}&view=week`);
        const data = await res.json();
        if (data.success) {
          setEvents(data.data.events || []);
          setCoachAvailability(data.data.coachAvailability || []);
        }
      } catch (err) {
        console.error('Calendar fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
    const interval = setInterval(fetchCalendar, 30000);
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
        // optimistic update
        setEvents((s) => [
          ...s,
          {
            id: `evt_${Math.random().toString(36).slice(2, 8)}`,
            title: `Session Request`,
            date: req.preferredDate,
            time: req.preferredTime,
            topic: req.topic,
            status: 'requested',
          },
        ]);
        alert('Request sent to coach');
      } else {
        alert(data.error || 'Failed to send request');
      }
    } catch (err) {
      console.error('Request error', err);
      alert('Failed to send request');
    }
  };

  const renderWeekGrid = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const times = [];
    for (let h = 8; h <= 18; h++) times.push(`${String(h).padStart(2, '0')}:00`);

    return (
      <div className="grid grid-cols-6 gap-2">
        <div className="col-span-1"></div>
        {days.map((d) => (
          <div key={d} className="font-semibold text-center">{d}</div>
        ))}

        {times.map((t) => (
          <React.Fragment key={t}>
            <div className="text-sm text-gray-600">{t}</div>
            {days.map((d) => {
              const cellEvents = events.filter((ev) => ev.time === t && new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short' }).startsWith(d));
              const blocked = coachAvailability.includes(t);
              return (
                <div key={`${d}-${t}`} className={`p-2 min-h-12 border rounded ${blocked ? 'bg-gray-100 text-gray-400' : ''}`}>
                  {cellEvents.map((ev) => (
                    <div key={ev.id} className={`rounded px-2 py-1 text-xs mb-1 ${ev.status === 'confirmed' ? 'bg-green-100 text-green-800' : ev.status === 'requested' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                      <div className="font-semibold">{ev.title || `Coaching with ${ev.coachName || ''}`}</div>
                      <div className="text-[11px]">{ev.time} • {ev.topic}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (loading) return <div className="p-8">Loading calendar...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setView('week')} className={`px-3 py-2 rounded ${view === 'week' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Week</button>
          <button onClick={() => setView('month')} className={`px-3 py-2 rounded ${view === 'month' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Month</button>
          <button onClick={() => window.location.reload()} className="px-3 py-2 rounded bg-white">Today</button>
        </div>
        <div>
          <button onClick={() => setShowRequestModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded">+ Request Session</button>
        </div>
      </div>

      <div className="bg-white rounded p-4 shadow">{view === 'week' ? renderWeekGrid() : <div>Month view coming soon</div>}</div>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Request a Session</h3>
            <form onSubmit={handleRequestSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">Date</label>
                <input required type="date" value={req.preferredDate} onChange={(e) => setReq({ ...req, preferredDate: e.target.value })} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Time</label>
                <select required value={req.preferredTime} onChange={(e) => setReq({ ...req, preferredTime: e.target.value })} className="w-full border px-3 py-2 rounded">
                  <option value="">Select</option>
                  {(coachAvailability || []).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Topic</label>
                <input required value={req.topic} onChange={(e) => setReq({ ...req, topic: e.target.value })} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium">Message</label>
                <textarea value={req.message} onChange={(e) => setReq({ ...req, message: e.target.value })} className="w-full border px-3 py-2 rounded" />
              </div>
              <div className="flex gap-3">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded" type="submit">Send Request</button>
                <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 bg-gray-200 py-2 rounded">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
