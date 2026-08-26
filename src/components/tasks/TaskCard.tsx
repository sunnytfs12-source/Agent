import React from 'react';
import { Task } from '../../types';
import { format, isPast, isToday } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onOpenAiBreakdown?: (task: Task) => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onOpenAiBreakdown,
  isDragging,
}) => {
  const isCompleted = task.status === 'completed';

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50';
      case 'high':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50';
      case 'medium':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50';
      case 'low':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getDueDateStatus = (dueDateStr?: string | null) => {
    if (!dueDateStr) return null;
    const date = new Date(dueDateStr);
    if (isCompleted) {
      return { text: format(date, 'MMM d, h:mm a'), className: 'text-slate-400' };
    }
    if (isPast(date) && !isToday(date)) {
      return {
        text: `Overdue (${format(date, 'MMM d')})`,
        className: 'text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md dark:bg-rose-950/40 dark:text-rose-300',
      };
    }
    if (isToday(date)) {
      return {
        text: `Due Today (${format(date, 'h:mm a')})`,
        className: 'text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md dark:bg-amber-950/40 dark:text-amber-300',
      };
    }
    return { text: format(date, 'MMM d, yyyy'), className: 'text-slate-500 dark:text-slate-400' };
  };

  const dueDateInfo = getDueDateStatus(task.due_date);
  const subtasksTotal = task.subtask_count || 0;
  const subtasksDone = task.completed_subtasks || 0;
  const subtaskPercent = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;

  return (
    <div
      className={`group relative rounded-2xl border bg-white p-4 transition-all duration-200 dark:bg-slate-900 ${
        isDragging
          ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-500/20 scale-[1.02]'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:hover:border-slate-700'
      } ${isCompleted ? 'bg-slate-50/70 dark:bg-slate-900/40 opacity-75' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox button */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
            isCompleted
              ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
              : 'border-slate-300 bg-white hover:border-indigo-500 dark:border-slate-600 dark:bg-slate-800'
          }`}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {isCompleted && <i className="bi bi-check text-base"></i>}
        </button>

        {/* Card Body */}
        <div className="flex-1 min-w-0">
          {/* Header row: Title & Action menu */}
          <div className="flex items-start justify-between gap-2">
            <h4
              onClick={() => onEdit(task)}
              className={`cursor-pointer text-sm font-semibold transition hover:text-indigo-600 dark:hover:text-indigo-400 ${
                isCompleted
                  ? 'text-slate-400 line-through dark:text-slate-500'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {task.title}
            </h4>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onOpenAiBreakdown && !isCompleted && (
                <button
                  type="button"
                  onClick={() => onOpenAiBreakdown(task)}
                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  title="Break down with AI"
                >
                  <i className="bi bi-stars"></i>
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                title="Edit task"
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="p-1 text-slate-400 hover:text-rose-600 transition"
                title="Delete task"
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>

          {/* Description preview */}
          {task.description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Categories & Tags */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {/* Priority Badge */}
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getPriorityBadge(
                task.priority
              )}`}
            >
              {task.priority}
            </span>

            {/* Categories */}
            {task.categories?.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.name}</span>
              </span>
            ))}

            {/* Tags */}
            {task.tags?.map((t) => (
              <span
                key={t.id}
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400"
              >
                #{t.name}
              </span>
            ))}
          </div>

          {/* Subtask Progress Bar */}
          {subtasksTotal > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <i className="bi bi-list-check"></i>
                  <span>Subtasks</span>
                </span>
                <span>
                  {subtasksDone}/{subtasksTotal} ({Math.round(subtaskPercent)}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${subtaskPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Card Footer: Due date & Effort Estimate */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-400 dark:border-slate-800">
            <div className="flex items-center gap-3">
              {dueDateInfo && (
                <div className={`flex items-center gap-1 text-[11px] ${dueDateInfo.className}`}>
                  <i className="bi bi-calendar-event"></i>
                  <span>{dueDateInfo.text}</span>
                </div>
              )}

              {task.effort_estimate && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <i className="bi bi-clock"></i>
                  <span>{task.effort_estimate}m</span>
                </span>
              )}
            </div>

            {task.ai_suggested && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500">
                <i className="bi bi-stars"></i>
                <span>AI</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
