import React, { useState } from 'react';
import { aiApi } from '../../api/aiApi';
import { AiParsedTask, CreateTaskPayload } from '../../types';
import { useCategories } from '../../hooks/useCategories';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface AiSmartInputProps {
  onCreateTask: (payload: CreateTaskPayload) => Promise<any>;
}

export const AiSmartInput: React.FC<AiSmartInputProps> = ({ onCreateTask }) => {
  const { categories } = useCategories();
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<AiParsedTask | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsParsing(true);
    setParsedResult(null);

    try {
      const res = await aiApi.parseTask(input.trim());
      setParsedResult(res.data);
    } catch (err: any) {
      toast.error('Could not parse task with AI');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmCreate = async () => {
    if (!parsedResult) return;

    setIsCreating(true);
    try {
      // Try to find matching category by name
      let categoryIds: string[] = [];
      if (parsedResult.category) {
        const found = categories.find(
          (c) => c.name.toLowerCase() === parsedResult.category?.toLowerCase()
        );
        if (found) categoryIds.push(found.id);
      }

      await onCreateTask({
        title: parsedResult.title,
        priority: parsedResult.priority,
        due_date: parsedResult.due_date,
        effort_estimate: parsedResult.effort_estimate,
        category_ids: categoryIds,
      });

      toast.success('Task created from AI prompt! 🎉');
      setInput('');
      setParsedResult(null);
    } catch (err: any) {
      toast.error('Failed to create task');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative rounded-3xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/50 p-4 shadow-sm dark:border-indigo-900/50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40">
      <form onSubmit={handleParse} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-indigo-500">
            <i className="bi bi-stars text-base"></i>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type naturally: 'Submit assignment tomorrow 5pm high priority 45min'..."
            className="w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pr-4 pl-10 text-xs text-slate-900 shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={isParsing || !input.trim()}
          className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-violet-500 active:scale-95 disabled:opacity-50"
        >
          {isParsing ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>AI Thinking...</span>
            </>
          ) : (
            <>
              <i className="bi bi-magic"></i>
              <span>Smart Parse</span>
            </>
          )}
        </button>
      </form>

      {/* Parsed Result Preview */}
      <AnimatePresence>
        {parsedResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm dark:border-indigo-900 dark:bg-slate-800"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    AI Parsed ({parsedResult.ai_source || 'AI'})
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {parsedResult.priority}
                  </span>
                  {parsedResult.category && (
                    <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                      {parsedResult.category}
                    </span>
                  )}
                </div>

                <h4 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                  {parsedResult.title}
                </h4>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  {parsedResult.due_date && (
                    <span className="flex items-center gap-1">
                      <i className="bi bi-calendar-event text-indigo-500"></i>
                      <span>{new Date(parsedResult.due_date).toLocaleString()}</span>
                    </span>
                  )}
                  {parsedResult.effort_estimate && (
                    <span className="flex items-center gap-1">
                      <i className="bi bi-clock text-indigo-500"></i>
                      <span>{parsedResult.effort_estimate} min</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setParsedResult(null)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  disabled={isCreating}
                  className="flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
                >
                  {isCreating ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <i className="bi bi-check2"></i>
                  )}
                  <span>Create Task</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
