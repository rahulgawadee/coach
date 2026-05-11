'use client';

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
  MoreVertical
} from 'lucide-react';

const BackgroundGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,#06060f 0%,#090912 50%,#07070e 100%)' }} />
    <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.035 }} xmlns="http://www.w3.org/2000/svg">
      <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
        <path d="M 72 0 L 0 0 0 72" fill="none" stroke="#0ea5e9" strokeWidth="0.5"/>
      </pattern>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div style={{ position:'absolute', top:'-20%', left:'-15%', width:'60vw', height:'60vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
    <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:'50vw', height:'50vw', borderRadius:'50%', background:'radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%)', filter:'blur(40px)' }} />
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
        return <MessageSquare className="text-sky-400" size={20} />;
      case 'session_request':
        return <Calendar className="text-indigo-400" size={20} />;
      case 'deadline':
        return <Clock className="text-amber-400" size={20} />;
      case 'assignment':
        return <ClipboardList className="text-emerald-400" size={20} />;
      default:
        return <Bell className="text-slate-400" size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div style={{ width:40, height:40, border:'1.5px solid rgba(14,165,233,0.15)', borderTop:'1.5px solid #0ea5e9', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
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
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          border-radius: 28px;
        }
        .btn-premium {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(2,132,199,0.2);
        }
        .btn-premium:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(2,132,199,0.3);
        }
        .btn-premium:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .notification-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .notification-item:hover {
          background: rgba(255,255,255,0.04);
          transform: translateX(4px);
        }
        @media (max-width: 640px) {
          .serif { font-size: 2.5rem !important; }
          .glass-card { border-radius: 20px; padding: 1.5rem !important; }
        }
      `}</style>

      {/* Header */}
      <div className="glass-card p-8 md:p-10 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-bold uppercase tracking-widest mb-4">
            <Bell size={12} />
            Alert Center
          </div>
          <h1 className="serif text-4xl md:text-5xl text-white mb-2">Notifications</h1>
          {unreadCount > 0 ? (
            <p className="text-slate-400 font-light">
              You have <span className="text-sky-400 font-bold">{unreadCount}</span> unread messages waiting for review.
            </p>
          ) : (
            <p className="text-slate-500 font-light">You're all caught up for now.</p>
          )}
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
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Notifications List */}
      <div className="glass-card overflow-hidden">
        <div className="divide-y divide-white/5">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item p-6 md:p-8 flex items-start gap-4 md:gap-6 relative group ${
                  !notification.read ? 'bg-sky-500/[0.03]' : ''
                }`}
              >
                {!notification.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                )}
                
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                  !notification.read 
                    ? 'bg-sky-500/10 border-sky-500/20 shadow-inner' 
                    : 'bg-white/5 border-white/10'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className={`text-base md:text-lg font-bold transition-colors ${
                        !notification.read ? 'text-white' : 'text-slate-300'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm md:text-base text-slate-400 mt-1 leading-relaxed font-light">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Clock size={12} />
                          {notification.timestamp}
                        </span>
                        {!notification.read && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-[9px] font-bold text-sky-400 uppercase tracking-tighter">
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/20 transition-all"
                          title="Mark as read"
                        >
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
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
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-slate-600">
                <Bell size={32} />
              </div>
              <h3 className="serif text-2xl text-white mb-2">No notifications yet</h3>
              <p className="text-slate-500 font-light max-w-xs mx-auto">
                We'll let you know when something important happens in your program.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
