'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/candidate/notifications?page=${page}&limit=20&filter=${filter}`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (!response.ok) throw new Error('Failed to load');
        const data = await response.json();
        setNotifications(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, authToken, filter, page]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch('/api/candidate/notifications', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, markAsRead: true }),
      });
      setNotifications(notifications.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/candidate/notifications', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading notifications...</div>;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', 'unread', 'messages', 'calendar', 'documents'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                className={`p-4 rounded-lg border cursor-pointer transition ${
                  notif.read
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  </div>
                  {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 ml-2 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Just now'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex gap-2 justify-center mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">{page}</span>
          <button
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
