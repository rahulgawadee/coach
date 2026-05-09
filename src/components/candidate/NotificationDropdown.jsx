'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationDropdown({ userEmail }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((item) => !item.read).length;

  const loadNotifications = async () => {
    if (!userEmail) return;
    try {
      const response = await fetch(`/api/candidate/notifications?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      if (data.success) setNotifications(data.data || []);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [userEmail]);

  const markAllRead = async () => {
    try {
      await fetch('/api/candidate/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="relative p-2 rounded-full hover:bg-gray-100"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h4 className="font-semibold text-gray-900">Notifications</h4>
            <button type="button" onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">
              Mark all as read
            </button>
          </div>

          <div className="max-h-80 overflow-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-sm text-gray-500 text-center">No notifications</p>
            )}
            {notifications.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setOpen(false);
                  router.push(item.href || '/candidate/dashboard');
                }}
                className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 ${
                  item.read ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-600">{item.message}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
