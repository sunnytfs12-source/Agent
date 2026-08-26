import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/authApi';
import { tasksApi } from '../api/tasksApi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [theme, setTheme] = useState(user?.theme || 'dark');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Snapshot export state
  const [isExporting, setIsExporting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await authApi.updateProfile({
        name,
        avatar_url: avatarUrl || null,
        theme,
      });
      updateUser(res.data);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully! Please sign in again.');
      setTimeout(() => {
        logout();
      }, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await tasksApi.exportSnapshot();
      toast.success('Tasks snapshot exported successfully to server/data/snapshots!');
      // Create download trigger on client side
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mscit_todo_backup_${user?.id}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to export snapshot');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-8">
      {/* Header Banner */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-2xl font-bold text-white shadow-md shadow-indigo-500/20">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name}
                className="h-full w-full rounded-2xl object-cover"
                onError={() => setAvatarUrl('')}
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
            <span
              className={`absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 ${
                user?.is_active ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
                {user?.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                  user?.role === 'superadmin'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    : user?.role === 'admin'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {user?.role}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          {isExporting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          ) : (
            <i className="bi bi-download text-indigo-500"></i>
          )}
          <span>Export My Tasks (JSON)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Profile Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <i className="bi bi-person-gear text-xl text-indigo-500"></i>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Details</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-500"
              />
              <p className="mt-1 text-xs text-slate-400">Email cannot be changed.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Avatar Image URL (Optional)
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Theme Preference
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="light">☀️ Light Theme</option>
                <option value="dark">🌙 Dark Theme</option>
                <option value="system">💻 System Default</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-98 disabled:opacity-50"
            >
              {isUpdatingProfile ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2"></i>
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Change Password Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <i className="bi bi-shield-lock text-xl text-violet-500"></i>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min 6 characters"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repeat new password"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 active:scale-98 disabled:opacity-50"
            >
              {isChangingPassword ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-key"></i>
                  <span>Change Password</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
