import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

export const AdminDashboard: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
  });

  const handleExportSystem = async () => {
    setIsExporting(true);
    try {
      const res = await adminApi.exportSystemSnapshot();
      toast.success('System database export generated successfully!');

      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mscit_system_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error('Failed to export system data');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" message="Loading admin dashboard analytics..." />;
  }

  const stats = dashboardData?.stats;
  const priorityBreakdown = dashboardData?.priorityBreakdown || [];
  const categoryBreakdown = dashboardData?.categoryBreakdown || [];

  const kpis = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: 'bi-people',
      color: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Tasks',
      value: stats?.totalTasks || 0,
      icon: 'bi-list-check',
      color: 'from-indigo-600 to-violet-600',
      bgLight: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Completed Tasks',
      value: stats?.completedTasks || 0,
      icon: 'bi-check2-all',
      color: 'from-emerald-600 to-teal-600',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Completion Rate',
      value: `${stats?.completionRate || 0}%`,
      icon: 'bi-pie-chart',
      color: 'from-amber-600 to-orange-600',
      bgLight: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Active Today',
      value: stats?.activeUsersToday || 0,
      icon: 'bi-person-check',
      color: 'from-purple-600 to-pink-600',
      bgLight: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Pending Tasks',
      value: stats?.pendingTasks || 0,
      icon: 'bi-hourglass-split',
      color: 'from-rose-600 to-red-600',
      bgLight: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time metrics, user growth, and task execution statistics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportSystem}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <i className="bi bi-download"></i>
            )}
            <span>Export Database Backup</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${kpi.bgLight}`}>
              <i className={`bi ${kpi.icon} text-lg`}></i>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {kpi.title}
            </p>
            <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
              {kpi.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Priority Distribution */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">
            Task Priority Distribution
          </h3>

          <div className="space-y-3">
            {priorityBreakdown.map((item) => {
              const total = stats?.totalTasks || 1;
              const percent = Math.round((item.count / total) * 100);

              const colorMap: Record<string, string> = {
                urgent: 'bg-rose-500',
                high: 'bg-amber-500',
                medium: 'bg-blue-500',
                low: 'bg-slate-400',
              };

              return (
                <div key={item.priority} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase text-slate-700 dark:text-slate-300">
                      {item.priority}
                    </span>
                    <span className="text-slate-500">
                      {item.count} tasks ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colorMap[item.priority] || 'bg-indigo-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">
            Top Categories
          </h3>

          {categoryBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No categories data</p>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cat.name}
                    </span>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    {cat.task_count} tasks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
