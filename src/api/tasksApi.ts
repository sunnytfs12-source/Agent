import { apiClient } from './client';
import {
  Task,
  Subtask,
  TaskFilters,
  CreateTaskPayload,
  UpdateTaskPayload,
  PaginatedResponse,
} from '../types';

export const tasksApi = {
  getTasks: async (filters: TaskFilters = {}): Promise<PaginatedResponse<Task>> => {
    const res = await apiClient.get<PaginatedResponse<Task>>('/tasks', { params: filters });
    return res.data;
  },

  getTaskById: async (id: string): Promise<{ data: Task }> => {
    const res = await apiClient.get<{ data: Task }>(`/tasks/${id}`);
    return res.data;
  },

  createTask: async (payload: CreateTaskPayload): Promise<{ data: Task }> => {
    const res = await apiClient.post<{ data: Task }>('/tasks', payload);
    return res.data;
  },

  updateTask: async (id: string, payload: UpdateTaskPayload): Promise<{ data: Task }> => {
    const res = await apiClient.put<{ data: Task }>(`/tasks/${id}`, payload);
    return res.data;
  },

  toggleComplete: async (id: string): Promise<{ data: Task }> => {
    const res = await apiClient.patch<{ data: Task }>(`/tasks/${id}/toggle`);
    return res.data;
  },

  deleteTask: async (id: string): Promise<{ data: { message: string } }> => {
    const res = await apiClient.delete(`/tasks/${id}`);
    return res.data;
  },

  reorderTasks: async (orderedIds: string[]): Promise<{ data: { message: string } }> => {
    const res = await apiClient.post('/tasks/reorder', { orderedIds });
    return res.data;
  },

  exportSnapshot: async (): Promise<{ data: any }> => {
    const res = await apiClient.get('/tasks/export/snapshot');
    return res.data;
  },

  // ── Subtasks ──────────────────────────────────────────────

  getSubtasks: async (taskId: string): Promise<{ data: Subtask[] }> => {
    const res = await apiClient.get<{ data: Subtask[] }>(`/tasks/${taskId}/subtasks`);
    return res.data;
  },

  createSubtask: async (taskId: string, title: string): Promise<{ data: Subtask }> => {
    const res = await apiClient.post<{ data: Subtask }>(`/tasks/${taskId}/subtasks`, { title });
    return res.data;
  },

  updateSubtask: async (
    taskId: string,
    subId: string,
    payload: { is_completed?: boolean; title?: string }
  ): Promise<{ data: Subtask }> => {
    const res = await apiClient.patch<{ data: Subtask }>(
      `/tasks/${taskId}/subtasks/${subId}`,
      payload
    );
    return res.data;
  },

  deleteSubtask: async (taskId: string, subId: string): Promise<{ data: { message: string } }> => {
    const res = await apiClient.delete(`/tasks/${taskId}/subtasks/${subId}`);
    return res.data;
  },
};
