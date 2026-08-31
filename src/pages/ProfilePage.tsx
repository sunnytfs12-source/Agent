import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/authApi';
import { tasksApi } from '../api/tasksApi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// ─── Avatar Editor ────────────────────────────────────────────────
interface AvatarEditorProps {
  value: string;
  name: string;
  onChange: (url: string) => void;
}

const AvatarEditor: React.FC<AvatarEditorProps> = ({ value, name, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlMode, setUrlMode] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Convert local file to base64 data-URL
  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result);
      setImgError(false);
      toast.success('Avatar updated — save your profile to keep it!');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const handleUrlApply = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\/.+\..+/.test(trimmed)) {
      toast.error('Enter a valid URL starting with http:// or https://');
      return;
    }
    onChange(trimmed);
    setUrlInput('');
    setUrlMode(false);
    setImgError(false);
  };

  const initials = name?.charAt(0).toUpperCase() || 'U';
  const hasAvatar = !!value && !imgError;

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Profile Picture
      </label>

      {/* ── Preview + Drop Zone ── */}
      <div className="flex items-center gap-4">
        {/* Avatar circle */}
        <div
          className={`relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20 ring-2 transition
            ${dragOver ? 'ring-indigo-500 scale-105' : 'ring-transparent hover:ring-indigo-400'}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          title="Click or drag an image here"
        >
          {hasAvatar ? (
            <img
              src={value}
              alt={name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-2xl font-bold text-white">{initials}</span>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/50 opacity-0 transition hover:opacity-100">
            <i className="bi bi-camera-fill text-lg text-white" />
            <span className="text-[10px] font-semibold text-white">Change</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 active:scale-95 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
          >
            <i className="bi bi-upload" />
            Upload photo
          </button>

          <button
            type="button"
            onClick={() => setUrlMode((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <i className="bi bi-link-45deg" />
            Use URL
          </button>

          {hasAvatar && (
            <button
              type="button"
              onClick={() => { onChange(''); setImgError(false); }}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-100 active:scale-95 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              <i className="bi bi-trash3" />
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* URL paste row */}
      {urlMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex gap-2"
        >
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlApply())}
            placeholder="https://example.com/photo.jpg"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
          <button
            type="button"
            onClick={handleUrlApply}
            className="rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => { setUrlMode(false); setUrlInput(''); }}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400"
          >
            Cancel
          </button>
        </motion.div>
      )}

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        JPG, PNG, GIF or WebP · max 2 MB · or paste any image URL
      </p>
    </div>
  );
};

// ─── Profile Page ─────────────────────────────────────────────────
export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();

  const [name, setName]               = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl]     = useState(user?.avatar_url || '');
  const [theme, setTheme]             = useState(user?.theme || 'dark');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
    if (newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    setIsChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Password changed! Please sign in again.');
      setTimeout(() => logout(), 1500);
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
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `mscit_todo_backup_${user?.id}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Tasks exported!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to export snapshot');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-8">

      {/* ── Header banner ── */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          {/* Live avatar preview in header */}
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-2xl font-bold text-white shadow-md shadow-indigo-500/20">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name}
                className="h-full w-full object-cover"
                onError={() => setAvatarUrl('')}
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
            <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 ${user?.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">{user?.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                user?.role === 'superadmin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                : user?.role === 'admin'    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
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
          {isExporting
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            : <i className="bi bi-download text-indigo-500" />}
          <span>Export My Tasks (JSON)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

        {/* ── Profile Settings Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <i className="bi bi-person-gear text-xl text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Details</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">

            {/* Avatar editor */}
            <AvatarEditor
              value={avatarUrl}
              name={name || user?.name || ''}
              onChange={setAvatarUrl}
            />

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Display Name */}
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

            {/* Email — read-only */}
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

            {/* Theme */}
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

            {/* Save */}
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
            >
              {isUpdatingProfile ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /><span>Saving…</span></>
              ) : (
                <><i className="bi bi-check2" /><span>Save Profile</span></>
              )}
            </button>
          </form>
        </motion.div>

        {/* ── Change Password Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
            <i className="bi bi-shield-lock text-xl text-violet-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Password</label>
              <input
                type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">New Password</label>
              <input
                type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Confirm New Password</label>
              <input
                type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repeat new password"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Password strength hint */}
            {newPassword.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[6, 8, 10, 12].map((len) => (
                    <div
                      key={len}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        newPassword.length >= len
                          ? newPassword.length >= 12 ? 'bg-emerald-500'
                            : newPassword.length >= 10 ? 'bg-yellow-400'
                            : 'bg-orange-400'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  {newPassword.length < 8 ? 'Weak' : newPassword.length < 10 ? 'Fair' : newPassword.length < 12 ? 'Good' : 'Strong'}
                  {' '}— {Math.max(0, 6 - newPassword.length) > 0 ? `${6 - newPassword.length} more chars needed` : 'minimum length met'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isChangingPassword}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50"
            >
              {isChangingPassword ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /><span>Updating…</span></>
              ) : (
                <><i className="bi bi-key" /><span>Change Password</span></>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
