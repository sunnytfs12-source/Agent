import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NotificationPopover } from '../notifications/NotificationPopover';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenAiQuickAdd?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenAiQuickAdd }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 md:px-6">
      {/* Left section: Hamburger + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white md:hidden"
        >
          <i className="bi bi-list text-xl"></i>
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20 transition group-hover:scale-105">
            <i className="bi bi-check2-circle text-lg text-white"></i>
          </div>
          <span className="hidden font-bold tracking-tight text-slate-900 dark:text-white sm:inline-block">
            MSCIT <span className="text-indigo-600 dark:text-indigo-400">Todo</span>
          </span>
        </Link>
      </div>

      {/* Right section: AI trigger, Notifications, User Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {onOpenAiQuickAdd && (
          <button
            onClick={onOpenAiQuickAdd}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-100 active:scale-95 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
          >
            <i className="bi bi-stars text-indigo-500"></i>
            <span className="hidden sm:inline">AI Smart Add</span>
          </button>
        )}

        <NotificationPopover />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 font-bold text-white shadow-sm">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <i className="bi bi-chevron-down text-[10px] text-slate-400"></i>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <span className="mt-1.5 inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  {user?.role}
                </span>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <i className="bi bi-person-gear text-sm text-slate-400"></i>
                  <span>Profile & Settings</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <i className="bi bi-shield-check text-sm text-indigo-500"></i>
                    <span>Admin Panel</span>
                  </Link>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <i className="bi bi-box-arrow-right text-sm"></i>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
