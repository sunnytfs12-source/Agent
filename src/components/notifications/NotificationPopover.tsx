import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export const NotificationPopover: React.FC = () => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_CREATED':
        return 'bi-check2-circle text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40';
      case 'TASK_COMPLETED':
        return 'bi-trophy text-amber-500 bg-amber-50 dark:bg-amber-950/40';
      case 'WELCOME':
        return 'bi-stars text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40';
      default:
        return 'bi-bell text-blue-500 bg-blue-50 dark:bg-blue-950/40';
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        title="Notifications"
      >
        <i className="bi bi-bell text-lg"></i>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <i className="bi bi-bell-slash mb-2 text-2xl"></i>
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) markRead(notif.id);
                  }}
                  className={`flex cursor-pointer items-start gap-3 p-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    !notif.is_read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${getNotificationIcon(
                      notif.type
                    )}`}
                  >
                    <i className={`bi ${getNotificationIcon(notif.type).split(' ')[0]}`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {notif.title}
                    </p>
                    {notif.message && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {notif.message}
                      </p>
                    )}
                    <span className="mt-1 block text-[10px] text-slate-400">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {!notif.is_read && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
