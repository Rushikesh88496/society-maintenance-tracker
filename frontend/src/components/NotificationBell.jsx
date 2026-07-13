import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, X, AlertTriangle, FileText, CreditCard, UserCheck, Info } from 'lucide-react';
import api from '../services/api';

const iconMap = {
  complaint: AlertTriangle,
  notice: FileText,
  bill: CreditCard,
  visitor: UserCheck,
};

const colorMap = {
  complaint: 'text-orange-500',
  notice: 'text-blue-500',
  bill: 'text-emerald-500',
  visitor: 'text-purple-500',
};

const bgMap = {
  complaint: 'bg-orange-100',
  notice: 'bg-blue-100',
  bill: 'bg-emerald-100',
  visitor: 'bg-purple-100',
};

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (e) { /* silent */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (e) { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (e) { /* silent */ }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-surface-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-surface-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-surface-100">
                <X size={16} className="text-surface-400" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-surface-400 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="mx-auto text-surface-300 mb-2" />
                <p className="text-sm text-surface-400">No notifications</p>
              </div>
            ) : (
              notifications.map(n => {
                const Icon = iconMap[n.type] || Info;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-surface-50 cursor-pointer transition-colors hover:bg-surface-50 ${
                      !n.is_read ? 'bg-brand-50/30' : ''
                    }`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bgMap[n.type] || 'bg-surface-100'}`}>
                      <Icon size={16} className={colorMap[n.type] || 'text-surface-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-surface-900' : 'text-surface-700'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-surface-500 truncate mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-surface-400 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
