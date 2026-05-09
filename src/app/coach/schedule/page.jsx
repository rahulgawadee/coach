'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';

export default function SchedulePage() {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [schedule, setSchedule] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockData, setBlockData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: 'Time Off',
    recurring: false,
  });
  const [newSession, setNewSession] = useState({
    candidateId: '',
    date: '',
    startTime: '',
    endTime: '',
    sessionType: 'Coaching',
    meetingLink: '',
    notes: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/coach/login');
      return;
    }

    const fetchSchedule = async () => {
      try {
        const response = await fetch('/api/coach/schedule', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/coach/login');
            return;
          }
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setSchedule(data.schedule || []);
          setPendingRequests(data.pendingRequests || []);
        } else {
          setError(data.error || 'Failed to load schedule');
        }
      } catch (err) {
        console.error('Schedule error:', err);
        setError('Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [isAuthenticated, hasRole, authToken, router]);

  const handleAddSession = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/coach/schedule', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSession),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      if (data.success) {
        setSchedule([...schedule, data.session]);
        setShowAddModal(false);
        setNewSession({
          candidateId: '',
          date: '',
          startTime: '',
          endTime: '',
          sessionType: 'Coaching',
          meetingLink: '',
          notes: '',
        });
      }
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create session');
    }
  };

  const handleApproveRequest = async (requestId, updatedData = {}) => {
    try {
      const response = await fetch('/api/coach/sessions/approve-request', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, ...updatedData }),
      });

      if (!response.ok) throw new Error('Failed to approve request');

      const data = await response.json();
      if (data.success) {
        setPendingRequests(pendingRequests.filter(r => r.id !== requestId));
        setSchedule([...schedule, data.confirmedSession]);
        alert('Session approved!');
      }
    } catch (err) {
      console.error('Error approving request:', err);
      setError('Failed to approve request');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const response = await fetch('/api/coach/sessions/decline-request', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) throw new Error('Failed to decline request');

      const data = await response.json();
      if (data.success) {
        setPendingRequests(pendingRequests.filter(r => r.id !== requestId));
        alert('Session request declined');
      }
    } catch (err) {
      console.error('Error declining request:', err);
      setError('Failed to decline request');
    }
  };

  const handleBlockTimeOff = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/coach/availability/block', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blockData),
      });

      if (!response.ok) throw new Error('Failed to block time off');

      const data = await response.json();
      if (data.success) {
        setShowBlockModal(false);
        setBlockData({ date: '', startTime: '', endTime: '', reason: 'Time Off', recurring: false });
        alert('Time blocked successfully!');
      }
    } catch (err) {
      console.error('Error blocking time:', err);
      setError('Failed to block time off');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Schedule Manager</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              + Add Session
            </button>
            <button
              onClick={() => setShowBlockModal(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              🚫 Block Time Off
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition">
              ⚙️ Set Availability
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('week')}
            className={`py-2 px-4 rounded-lg font-medium transition ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`py-2 px-4 rounded-lg font-medium transition ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Month View
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Pending Session Requests ({pendingRequests.length})</h2>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between bg-white p-4 rounded-lg border border-yellow-200">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{request.candidateName || 'Candidate'}</p>
                    <p className="text-sm text-gray-600">{request.date} | {request.startTime} - {request.endTime}</p>
                    {request.notes && <p className="text-sm text-gray-500 mt-1">{request.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      ✗ Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Display */}
        <div className="bg-white rounded-lg shadow p-6">
          {viewMode === 'week' ? (
            <div className="grid grid-cols-5 gap-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                <div key={day} className="border rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-4">{day}</h3>
                  <div className="space-y-3">
                    {schedule
                      .filter((s) => s.day === day)
                      .map((session) => (
                        <div key={session.id} className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                          <p className="text-sm font-semibold text-gray-900">{session.time}</p>
                          <p className="text-xs text-gray-600 mt-1">{session.candidateName}</p>
                          <p className="text-xs text-gray-500 mt-1">{session.sessionType}</p>
                          <div className="flex gap-2 mt-3">
                            <button className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded hover:bg-blue-300">
                              Edit
                            </button>
                            <button className="text-xs bg-red-200 text-red-700 px-2 py-1 rounded hover:bg-red-300">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Month view calendar will be displayed here</p>
            </div>
          )}
        </div>

        {/* Add Session Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-96 overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Add New Session</h2>
              </div>

              <form onSubmit={handleAddSession} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Candidate</label>
                  <select
                    required
                    value={newSession.candidateId}
                    onChange={(e) => setNewSession({ ...newSession, candidateId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select a candidate...</option>
                    <option value="1">Candidate 1</option>
                    <option value="2">Candidate 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={newSession.startTime}
                      onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={newSession.endTime}
                      onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                  <select
                    value={newSession.sessionType}
                    onChange={(e) => setNewSession({ ...newSession, sessionType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option>Coaching</option>
                    <option>CV Review</option>
                    <option>Interview Prep</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                  <input
                    type="url"
                    value={newSession.meetingLink}
                    onChange={(e) => setNewSession({ ...newSession, meetingLink: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newSession.notes}
                    onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Create Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Block Time Off Modal */}
        {showBlockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-96 overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Block Time Off</h2>
              </div>

              <form onSubmit={handleBlockTimeOff} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={blockData.date}
                    onChange={(e) => setBlockData({ ...blockData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={blockData.startTime}
                      onChange={(e) => setBlockData({ ...blockData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={blockData.endTime}
                      onChange={(e) => setBlockData({ ...blockData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <input
                    type="text"
                    value={blockData.reason}
                    onChange={(e) => setBlockData({ ...blockData, reason: e.target.value })}
                    placeholder="e.g., Personal, Meeting, Doctor's Appointment"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={blockData.recurring}
                    onChange={(e) => setBlockData({ ...blockData, recurring: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="recurring" className="ml-2 text-sm text-gray-700">
                    Recurring (weekly)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Block Time
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBlockModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
