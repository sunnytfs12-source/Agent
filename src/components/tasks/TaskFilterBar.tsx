import React from 'react';
import { TaskFilters, TaskStatus, TaskPriority } from '../../types';
import { useCategories } from '../../hooks/useCategories';

interface TaskFilterBarProps {
  filters: TaskFilters;
  onFilterChange: (filters: Partial<TaskFilters>) => void;
  viewMode: 'list' | 'kanban';
  onViewModeChange: (mode: 'list' | 'kanban') => void;
  onOpenCreateTask: () => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  onOpenCreateTask,
}) => {
  const { categories, tags } = useCategories();

  const statuses: Array<{ label: string; value: TaskStatus | 'all' }> = [
    { label: 'All Tasks', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
  ];

  const priorities: Array<{ label: string; value: TaskPriority | 'all' }> = [
    { label: 'All Priorities', value: 'all' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Top row: Search, View Mode, New Task Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <i className="bi bi-search text-xs"></i>
          </div>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search tasks by title or description..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-8 pl-8 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
            >
              <i className="bi bi-x text-base"></i>
            </button>
          )}
        </div>

        {/* View Switcher & Action Button */}
        <div className="flex items-center gap-2">
          {/* List / Kanban switch */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="List View"
            >
              <i className="bi bi-list-task"></i>
              <span className="hidden md:inline">List</span>
            </button>
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Kanban Board"
            >
              <i className="bi bi-kanban"></i>
              <span className="hidden md:inline">Kanban</span>
            </button>
          </div>

          {/* New Task Button */}
          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95 shrink-0"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filters (Status Pills, Priority, Category, Tag, Sort) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {statuses.map((st) => {
            const isActive = (filters.status || 'all') === st.value;
            return (
              <button
                key={st.value}
                onClick={() => onFilterChange({ status: st.value, page: 1 })}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority */}
          <select
            value={filters.priority || 'all'}
            onChange={(e) =>
              onFilterChange({ priority: e.target.value as TaskPriority | 'all', page: 1 })
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {priorities.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={filters.category_id || ''}
            onChange={(e) => onFilterChange({ category_id: e.target.value || undefined, page: 1 })}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Tag Filter */}
          <select
            value={filters.tag_id || ''}
            onChange={(e) => onFilterChange({ tag_id: e.target.value || undefined, page: 1 })}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={`${filters.sort || 'order_index'}-${filters.order || 'ASC'}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-');
              onFilterChange({ sort: sort as any, order: order as any });
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="order_index-ASC">Manual Order</option>
            <option value="due_date-ASC">Due Date (Earliest)</option>
            <option value="due_date-DESC">Due Date (Latest)</option>
            <option value="priority-DESC">Priority (High to Low)</option>
            <option value="title-ASC">Title (A-Z)</option>
            <option value="created_at-DESC">Newest Created</option>
          </select>
        </div>
      </div>
    </div>
  );
};
