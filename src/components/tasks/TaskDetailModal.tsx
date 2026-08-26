import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { useCategories } from '../../hooks/useCategories';
import { useTask } from '../../hooks/useTasks';
import { SubtaskList } from './SubtaskList';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSave: (taskData: any) => Promise<any>;
  onDelete?: (id: string) => Promise<any>;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  onSave,
  onDelete,
}) => {
  const { categories, tags } = useCategories();
  const { subtasks, createSubtask, updateSubtask, deleteSubtask } = useTask(task?.id);

  const isEditing = !!task;

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [effortEstimate, setEffortEstimate] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'pending');
      setDueDate(task.due_date ? task.due_date.slice(0, 16) : '');
      setSelectedCategoryIds(task.categories?.map((c) => c.id) || []);
      setSelectedTagIds(task.tags?.map((t) => t.id) || []);
      setEffortEstimate(task.effort_estimate || 30);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('pending');
      setDueDate('');
      setSelectedCategoryIds([]);
      setSelectedTagIds([]);
      setEffortEstimate(30);
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        category_ids: selectedCategoryIds,
        tag_ids: selectedTagIds,
        effort_estimate: effortEstimate,
      });
      onClose();
    } catch (err) {
      // Error handled in parent mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <i className={`bi ${isEditing ? 'bi-pencil-square' : 'bi-plus-circle'} text-lg`}></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Task' : 'Create New Task'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Update task properties and checklist' : 'Add task details and schedules'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add relevant notes, links, or instructions..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Status, Priority & Due Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Effort Estimate Slider */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Effort Estimate
              </label>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {effortEstimate >= 60
                  ? `${Math.floor(effortEstimate / 60)}h ${effortEstimate % 60 ? `${effortEstimate % 60}m` : ''}`
                  : `${effortEstimate} min`}
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="240"
              step="15"
              value={effortEstimate}
              onChange={(e) => setEffortEstimate(parseInt(e.target.value))}
              className="mt-2 w-full accent-indigo-600"
            />
          </div>

          {/* Categories selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Categories
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {categories.map((c) => {
                const isSelected = selectedCategoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: isSelected ? '#ffffff' : c.color }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tags
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {tags.map((t) => {
                const isSelected = selectedTagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    #{t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtasks (if editing existing task) */}
          {isEditing && (
            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
              <SubtaskList
                taskId={task.id}
                taskTitle={task.title}
                taskDescription={task.description}
                subtasks={subtasks}
                onAddSubtask={(t) => createSubtask({ taskId: task.id, title: t })}
                onToggleSubtask={(subId, is_completed) =>
                  updateSubtask({ taskId: task.id, subId, payload: { is_completed } })
                }
                onDeleteSubtask={(subId) => deleteSubtask({ taskId: task.id, subId })}
              />
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 p-6 dark:border-slate-800">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this task?')) {
                  onDelete(task.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <i className="bi bi-trash"></i>
              <span>Delete</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <i className="bi bi-check2"></i>
              )}
              <span>{isEditing ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
