'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import apiService from '@/services/api';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole } = useAuth();
  const [authToken] = useLocalStorage('token', '');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !hasRole('Coach')) {
      router.push('/login');
      return;
    }

    const fetchNotifications = async () => {
      try {
        const data = await apiService.coach.getNotifications();
        setNotifications(data.data || []);
      } catch (err) {
        console.error('Notifications error:', err);
        if (err.message === 'Unauthorized') {
          router.push('/login');
          return;
        }
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, hasRole, authToken, router]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiService.coach.markNotificationAsRead(notificationId);
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error('Error updating notification:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.coach.markAllNotificationsAsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await apiService.coach.deleteNotification(notificationId);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'session_request':
        return '📅';
      case 'deadline':
        return '⏰';
      case 'assignment':
        return '📋';
      default:
        return '🔔';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-gray-600 mt-1">
                You have <span className="font-semibold">{unreadCount}</span> unread notification
                {unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg p-4 border-l-4 transition cursor-pointer ${
                  notification.read
                    ? 'bg-white border-gray-300 hover:bg-gray-50'
                    : 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl shrink-0">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <p className="text-gray-700 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-2">{notification.timestamp}</p>
                      </div>
                      <div className="flex gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-3 h-3 bg-blue-600 rounded-full shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl mb-4 block">🔔</span>
              <p>No notifications yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
