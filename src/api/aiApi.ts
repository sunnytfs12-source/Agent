/**
 * AI API
 *
 * Currently returns mock responses because the AI backend is not yet integrated.
 * When an AI service is connected, replace each method with a real apiClient call.
 */
import { AiParsedTask, AiSuggestion, Task, TaskPriority } from '../types';

export const aiApi = {
  checkHealth: async (): Promise<{ available: boolean; reason?: string }> => {
    return { available: false, reason: 'AI service not yet connected.' };
  },

  parseTask: async (input: string): Promise<{ data: AiParsedTask; input: string }> => {
    const l = input.toLowerCase();
    const priority: TaskPriority = l.includes('urgent')
      ? 'urgent'
      : l.includes('high')
      ? 'high'
      : l.includes('low')
      ? 'low'
      : 'medium';
    return { data: { title: input, priority, effort_estimate: 1 }, input };
  },

  getSuggestions: async (): Promise<{ data: AiSuggestion[] }> => {
    return { data: [] };
  },

  prioritizeTasks: async (): Promise<{ data: Task[] }> => {
    return { data: [] };
  },

  breakdownTask: async (
    title: string,
    _description?: string,
    _taskId?: string
  ): Promise<{ data: string[] }> => {
    return {
      data: [
        `Research ${title}`,
        `Plan ${title}`,
        `Execute ${title}`,
        `Review ${title}`,
      ],
    };
  },
};
