import React, { useState } from 'react';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminUsersTable } from '../components/admin/AdminUsersTable';
import { AdminActivityLog } from '../components/admin/AdminActivityLog';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'logs'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard & Metrics', icon: 'bi-speedometer2' },
    { id: 'users', label: 'User Governance', icon: 'bi-people' },
    { id: 'logs', label: 'Security & Audit Logs', icon: 'bi-journal-text' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Admin Title & Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
            <i className="bi bi-shield-check text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl">
              Administrator Control Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage users, observe system activity, and view live metrics
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === t.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <i className={`bi ${t.icon}`}></i>
              <span className="hidden md:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'users' && <AdminUsersTable />}
        {activeTab === 'logs' && <AdminActivityLog />}
      </div>
    </div>
  );
};
