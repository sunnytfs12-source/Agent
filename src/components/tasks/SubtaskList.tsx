import React, { useState } from 'react';
import { Subtask } from '../../types';
import { aiApi } from '../../api/aiApi';
import toast from 'react-hot-toast';

interface SubtaskListProps {
  taskId: string;
  taskTitle: string;
  taskDescription?: string | null;
  subtasks: Subtask[];
  onAddSubtask: (title: string) => Promise<any>;
  onToggleSubtask: (subId: string, is_completed: boolean) => Promise<any>;
  onDeleteSubtask: (subId: string) => Promise<any>;
}

export const SubtaskList: React.FC<SubtaskListProps> = ({
  taskTitle,
  taskDescription,
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsAdding(true);
    try {
      await onAddSubtask(newTitle.trim());
      setNewTitle('');
    } catch (err: any) {
      toast.error('Failed to add subtask');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAiBreakdown = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await aiApi.breakdownTask(taskTitle, taskDescription || undefined);
      if (res.data && res.data.length > 0) {
        for (const item of res.data) {
          await onAddSubtask(item);
        }
        toast.success(`Added ${res.data.length} subtasks with AI! ✨`);
      } else {
        toast.error('Could not generate subtasks');
      }
    } catch (err: any) {
      toast.error('AI Breakdown failed');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Subtasks ({subtasks.filter((s) => s.is_completed).length}/{subtasks.length})
        </h4>

        <button
          type="button"
          onClick={handleAiBreakdown}
          disabled={isGeneratingAi}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition disabled:opacity-50"
        >
          {isGeneratingAi ? (
            <>
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <i className="bi bi-stars"></i>
              <span>Auto-Breakdown (AI)</span>
            </>
          )}
        </button>
      </div>

      {/* Subtasks checklist */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {subtasks.length === 0 ? (
          <p className="py-2 text-center text-xs text-slate-400">
            No subtasks yet. Add items below or use AI to break down this task.
          </p>
        ) : (
          subtasks.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-2 text-xs transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
                <input
                  type="checkbox"
                  checked={s.is_completed}
                  onChange={(e) => onToggleSubtask(s.id, e.target.checked)}
                  className="h-4 w-4 rounded-md text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span
                  className={`truncate ${
                    s.is_completed
                      ? 'text-slate-400 line-through dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-200 font-medium'
                  }`}
                >
                  {s.title}
                </span>
              </label>

              <button
                type="button"
                onClick={() => onDeleteSubtask(s.id)}
                className="ml-2 text-slate-400 hover:text-rose-500 p-1"
                title="Delete subtask"
              >
                <i className="bi bi-x-lg text-xs"></i>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Subtask Input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new checklist item..."
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={isAdding || !newTitle.trim()}
          className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-500 disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
};
