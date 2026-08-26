import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export const AdminActivityLog: React.FC = () => {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['admin-activity-log', page, entityFilter],
    queryFn: () =>
      adminApi.getActivityLogs({
        page,
        limit: 15,
        entity_type: entityFilter || undefined,
      }),
  });

  const getActionBadge = (action: string) => {
    if (action.includes('CREATED') || action.includes('REGISTERED')) {
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
    }
    if (action.includes('UPDATED')) {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
    }
    if (action.includes('DELETED')) {
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
    }
    if (action.includes('LOGIN')) {
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  };

  return (
    <div className="space-y-4">
      {/* Filter header */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Security & Audit Log</h3>
          <p className="text-xs text-slate-400">Track all user mutations, logins, and system events</p>
        </div>

        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="">All Entities</option>
          <option value="task">Tasks</option>
          <option value="user">Users</option>
          <option value="category">Categories</option>
        </select>
      </div>

      {/* Logs list */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner size="md" message="Loading audit logs..." />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {logsData?.data.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasDiff = log.old_data || log.new_data;

              return (
                <div key={log.id} className="p-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {log.user_name || 'System / Anonymous'}
                      </span>
                      {log.user_email && (
                        <span className="text-slate-400 text-[11px]">({log.user_email})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                      {log.ip_address && (
                        <span>
                          IP: <span className="font-mono text-slate-500">{log.ip_address}</span>
                        </span>
                      )}
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Collapsible JSON diff inspector */}
                  {hasDiff && (
                    <div className="mt-2">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                        <span>{isExpanded ? 'Hide Payload Diff' : 'View Payload Diff'}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl bg-slate-950 p-3 font-mono text-[11px] text-slate-200">
                          {log.old_data && (
                            <div>
                              <p className="font-bold text-rose-400 mb-1">Old Data:</p>
                              <pre className="overflow-x-auto whitespace-pre-wrap">
                                {typeof log.old_data === 'string'
                                  ? log.old_data
                                  : JSON.stringify(log.old_data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_data && (
                            <div>
                              <p className="font-bold text-emerald-400 mb-1">New Data:</p>
                              <pre className="overflow-x-auto whitespace-pre-wrap">
                                {typeof log.new_data === 'string'
                                  ? log.new_data
                                  : JSON.stringify(log.new_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination footer */}
        {logsData?.pagination && logsData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs text-slate-500 dark:border-slate-800">
            <span>
              Page {logsData.pagination.page} of {logsData.pagination.totalPages} (
              {logsData.pagination.total} events)
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
                disabled={page >= logsData.pagination.totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
