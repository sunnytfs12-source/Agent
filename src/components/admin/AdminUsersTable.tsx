import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { User, UserRole } from '../../types';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

export const AdminUsersTable: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create User modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [isCreating, setIsCreating] = useState(false);

  // Edit/Reset Password state
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: () =>
      adminApi.getUsers({
        page,
        limit: 10,
        search: search || undefined,
        role: roleFilter || undefined,
      }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      adminApi.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update user');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await adminApi.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User created successfully');
      setCreateModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !resetPassword) return;

    try {
      await updateUserMutation.mutateAsync({
        id: resetModalUser.id,
        payload: { password: resetPassword },
      });
      toast.success(`Password reset for ${resetModalUser.name}`);
      setResetModalUser(null);
      setResetPassword('');
    } catch {
      // Error handled in mutation
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <i className="bi bi-search absolute left-3 top-2.5 text-xs text-slate-400"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search user name or email..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-8 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95"
        >
          <i className="bi bi-person-plus"></i>
          <span>Add User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner size="md" message="Loading users list..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Tasks</th>
                  <th className="px-4 py-3.5">Last Login</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersData?.data.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 font-bold text-white shadow-sm">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt={u.name}
                              className="h-full w-full rounded-xl object-cover"
                            />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-slate-400 text-[11px]">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={u.role}
                        onChange={(e) =>
                          updateUserMutation.mutate({
                            id: u.id,
                            payload: { role: e.target.value },
                          })
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        onClick={() =>
                          updateUserMutation.mutate({
                            id: u.id,
                            payload: { is_active: !u.is_active },
                          })
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span>{u.is_active ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {u.completed_task_count || 0} / {u.task_count || 0}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-400 text-[11px]">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setResetModalUser(u)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                          title="Reset Password"
                        >
                          <i className="bi bi-key"></i>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete user ${u.name}? This will delete all their tasks.`)) {
                              deleteUserMutation.mutate(u.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                          title="Delete User"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {usersData?.pagination && usersData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500 dark:border-slate-800">
            <span>
              Page {usersData.pagination.page} of {usersData.pagination.totalPages} (
              {usersData.pagination.total} total users)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= usersData.pagination.totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Create New User</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="user@example.com"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Reset Password for {resetModalUser.name}
            </h3>
            <p className="mt-1 text-xs text-slate-400">Enter a new password for this account.</p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              <div>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
