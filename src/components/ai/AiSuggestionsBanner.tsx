import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiApi } from '../../api/aiApi';
import toast from 'react-hot-toast';

interface AiSuggestionsBannerProps {
  onApplyPrioritize?: (orderedIds: string[]) => void;
  onFilterDueToday?: () => void;
  onFilterOverdue?: () => void;
}

export const AiSuggestionsBanner: React.FC<AiSuggestionsBannerProps> = ({
  onApplyPrioritize,
}) => {
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  const { data: suggestionsData } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: aiApi.getSuggestions,
    staleTime: 60000,
  });

  const suggestions = suggestionsData?.data || [];

  const handlePrioritize = async () => {
    setIsPrioritizing(true);
    try {
      const res = await aiApi.prioritizeTasks();
      if (res.data && res.data.length > 0) {
        const orderedIds = res.data.map((t) => t.id);
        if (onApplyPrioritize) onApplyPrioritize(orderedIds);
        toast.success('Tasks prioritized using AI urgency scoring! ⚡');
      } else {
        toast('No pending tasks to prioritize', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      toast.error('AI prioritization failed');
    } finally {
      setIsPrioritizing(false);
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/20">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
          <i className="bi bi-lightbulb-fill"></i>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
            Smart AI Insights & Alerts
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-amber-800/80 dark:text-amber-300/80">
            {suggestions.map((s, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span>•</span>
                <span>{s.message}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handlePrioritize}
        disabled={isPrioritizing}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-xs transition hover:bg-amber-50 active:scale-95 disabled:opacity-50 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-200 dark:hover:bg-slate-800 shrink-0"
      >
        {isPrioritizing ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
        ) : (
          <i className="bi bi-lightning-charge-fill text-amber-500"></i>
        )}
        <span>AI Auto-Prioritize</span>
      </button>
    </div>
  );
};
