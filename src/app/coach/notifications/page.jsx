"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useLocalStorage from '@/hooks/useLocalStorage';
import apiService from '@/services/api';
import { 
  Bell, 
  MessageSquare, 
  Calendar, 
  Clock, 
  ClipboardList, 
  CheckCircle2, 
  Trash2, 
  CheckSquare,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Inbox
} from 'lucide-react';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'var(--background)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
        <path d="M 72 0 L 0 0 0 72" fill="none" stroke="var(--primary)" strokeWidth="0.5"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter:'blur(40px)' }} />
  </div>
);

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
        return <MessageSquare className="text-var(--primary)" size={20} />;
      case 'session_request':
        return <Calendar className="text-var(--primary)" size={20} />;
      case 'deadline':
        return <Clock className="text-rose-400" size={20} />;
      case 'assignment':
        return <ClipboardList className="text-emerald-500" size={20} />;
      default:
        return <Bell className="text-var(--text-muted)" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid var(--primary-glow)', borderTop:'1.5px solid var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative max-w-5xl mx-auto pb-16 animate-in fade-in duration-500 font-['DM_Sans',sans-serif]">
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
          border: 1px solid transparent;
        }
        .btn-premium {
          background: var(--primary);
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px var(--primary-glow);
        }
        .btn-premium:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(2,132,199,0.3);
        }
        .notification-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .notification-item:hover {
          background: rgba(255,255,255,0.04);
        }
      `}</style>

      {/* Header */}
      <div className="pt-8 px-4 sm:px-0 flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-var(--primary-glow) border border-var(--primary) border-opacity-20 text-var(--primary) text-[10px] font-bold uppercase tracking-widest mb-4">
            <Bell size={12} />
            Alert Inbox
          </div>
          <h1 className="serif text-4xl sm:text-5xl text-var(--text-primary) font-medium tracking-tight">Notifications</h1>
          <p className="text-var(--text-muted) font-light mt-2">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread updates requiring your attention.` 
              : "Your communication stream is fully synchronized."}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn-premium w-full sm:w-auto justify-center"
          >
            <CheckSquare size={18} />
            Mark all read
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 mx-4 sm:mx-0 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div className="mx-4 sm:mx-0 glass-card overflow-hidden">
        <div className="divide-y divide-var(--card-border)">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item p-6 sm:p-8 flex items-start gap-4 sm:gap-6 relative group ${
                  !notification.read ? 'bg-var(--primary-glow) bg-opacity-30' : ''
                }`}
              >
                {!notification.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-var(--primary) shadow-[0_0_15px_var(--primary-glow)]" />
                )}
                
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                  !notification.read 
                    ? 'bg-var(--primary-glow) border-var(--primary) border-opacity-30 shadow-inner' 
                    : 'bg-var(--card-bg) border-var(--card-border)'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className={`text-base sm:text-lg font-bold transition-colors ${
                        !notification.read ? 'text-var(--text-primary)' : 'text-var(--text-muted)'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm sm:text-base text-var(--text-secondary) mt-1 leading-relaxed font-light">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-[10px] font-bold text-var(--text-muted) uppercase tracking-widest flex items-center gap-1.5">
                          <Clock size={12} />
                          {notification.timestamp}
                        </span>
                        {!notification.read && (
                          <span className="px-2 py-0.5 rounded-md bg-var(--primary-glow) border border-var(--primary) border-opacity-30 text-[9px] font-black text-var(--primary) uppercase tracking-tighter">
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-all">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-3 rounded-xl bg-var(--card-bg) border border-var(--card-border) text-var(--text-muted) hover:text-var(--primary) hover:bg-var(--primary-glow) transition-all"
                          title="Mark as read"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-3 rounded-xl bg-var(--card-bg) border border-var(--card-border) text-var(--text-muted) hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Delete notification"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-var(--card-bg) border border-var(--card-border) flex items-center justify-center mx-auto mb-6 text-var(--text-muted)">
                <Inbox size={32} />
              </div>
              <h3 className="serif text-2xl text-var(--text-primary) mb-2">Clean Slate</h3>
              <p className="text-var(--text-muted) font-light max-w-xs mx-auto">
                No new notifications. We'll alert you here when important program updates arrive.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
