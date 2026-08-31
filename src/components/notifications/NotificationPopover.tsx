import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

// ── Icon + colour per notification type ──────────────────────────
interface IconStyle {
  icon: string;
  bg: string;
  fg: string;
}

function getStyle(type: string): IconStyle {
  const t = type.toUpperCase(); // normalise — handles 'welcome' and 'WELCOME'
  switch (t) {
    case 'TASK_CREATED':
      return { icon: 'bi-plus-circle-fill',     bg: 'bg-emerald-100 dark:bg-emerald-900/40', fg: 'text-emerald-600 dark:text-emerald-400' };
    case 'TASK_UPDATED':
      return { icon: 'bi-pencil-fill',           bg: 'bg-blue-100 dark:bg-blue-900/40',      fg: 'text-blue-600 dark:text-blue-400' };
    case 'TASK_COMPLETED':
      return { icon: 'bi-trophy-fill',           bg: 'bg-amber-100 dark:bg-amber-900/40',    fg: 'text-amber-600 dark:text-amber-400' };
    case 'TASK_DELETED':
      return { icon: 'bi-trash3-fill',           bg: 'bg-red-100 dark:bg-red-900/40',        fg: 'text-red-500 dark:text-red-400' };
    case 'LOGIN':
      return { icon: 'bi-box-arrow-in-right',    bg: 'bg-violet-100 dark:bg-violet-900/40',  fg: 'text-violet-600 dark:text-violet-400' };
    case 'WELCOME':
      return { icon: 'bi-stars',                 bg: 'bg-indigo-100 dark:bg-indigo-900/40',  fg: 'text-indigo-600 dark:text-indigo-400' };
    default:
      return { icon: 'bi-bell-fill',             bg: 'bg-slate-100 dark:bg-slate-800',       fg: 'text-slate-500 dark:text-slate-400' };
  }
}

export const NotificationPopover: React.FC = () => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <i className={`bi text-lg ${isOpen ? 'bi-bell-fill text-indigo-600 dark:text-indigo-400' : 'bi-bell'}`} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover panel */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:w-96">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <i className="bi bi-bell text-base text-indigo-500" />
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
                className="text-xs font-medium text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <i className="bi bi-bell-slash text-xl text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const s = getStyle(notif.type);
                return (
                  <div
                    key={notif.id}
                    onClick={() => { if (!notif.is_read) markRead(notif.id); }}
                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition
                      ${!notif.is_read
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    {/* Icon badge */}
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                      <i className={`bi ${s.icon} text-sm ${s.fg}`} />
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-xs font-semibold ${!notif.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                          {notif.message}
                        </p>
                      )}
                      <span className="mt-1 block text-[10px] text-slate-400 dark:text-slate-500">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Unread dot */}
                    {!notif.is_read && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2 dark:border-slate-800">
              <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
                Showing {notifications.length} most recent
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
