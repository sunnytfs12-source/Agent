import React, { useState, useEffect } from 'react';
import { Task } from '../../types';
import { aiApi } from '../../api/aiApi';
import toast from 'react-hot-toast';

interface AiBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onAddSubtask: (taskId: string, title: string) => Promise<any>;
}

export const AiBreakdownModal: React.FC<AiBreakdownModalProps> = ({
  isOpen,
  onClose,
  task,
  onAddSubtask,
}) => {
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      fetchBreakdown();
    } else {
      setSubtasks([]);
    }
  }, [isOpen, task]);

  const fetchBreakdown = async () => {
    if (!task) return;
    setIsLoading(true);
    try {
      const res = await aiApi.breakdownTask(task.title, task.description || undefined);
      setSubtasks(res.data || []);
    } catch (err: any) {
      toast.error('Could not generate subtasks');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  const handleRemoveItem = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, val: string) => {
    setSubtasks((prev) => prev.map((item, i) => (i === index ? val : item)));
  };

  const handleAddItem = () => {
    setSubtasks((prev) => [...prev, '']);
  };

  const handleApply = async () => {
    const validItems = subtasks.filter((s) => s.trim().length > 0);
    if (validItems.length === 0) return;

    setIsApplying(true);
    try {
      for (const item of validItems) {
        await onAddSubtask(task.id, item.trim());
      }
      toast.success(`Added ${validItems.length} subtasks to "${task.title}"! ✨`);
      onClose();
    } catch (err: any) {
      toast.error('Failed to add subtasks');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <i className="bi bi-stars"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                AI Task Breakdown
              </h3>
              <p className="text-xs text-slate-400">"{task.title}"</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Breakdown Items List */}
        <div className="my-4 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              <p className="mt-3 text-xs text-slate-500">AI is analyzing and decomposing task...</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Generated Subtasks ({subtasks.length}):
              </p>
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {subtasks.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleUpdateItem(idx, e.target.value)}
                      placeholder="Subtask description..."
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                      title="Remove item"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Add another item</span>
                </button>

                <button
                  type="button"
                  onClick={fetchBreakdown}
                  className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                  <span>Regenerate</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying || isLoading || subtasks.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {isApplying ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <i className="bi bi-check2"></i>
            )}
            <span>Apply Subtasks</span>
          </button>
        </div>
      </div>
    </div>
  );
};
