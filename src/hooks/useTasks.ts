import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasksApi';
import { Task, TaskFilters, CreateTaskPayload, UpdateTaskPayload, PaginatedResponse } from '../types';
import toast from 'react-hot-toast';

export const useTasks = (filters: TaskFilters = {}) => {
  const queryClient = useQueryClient();

  // Fetch tasks query
  const tasksQuery = useQuery<PaginatedResponse<Task>>({
    queryKey: ['tasks', filters],
    queryFn: () => tasksApi.getTasks(filters),
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Task created!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create task');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      tasksApi.updateTask(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', res.data.id] });
      toast.success('Task updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update task');
    },
  });

  // Toggle complete mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.toggleComplete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', res.data.id] });
      if (res.data.status === 'completed') {
        toast.success('Task completed! 🎉');
      } else {
        toast('Task reopened', { icon: '🔄' });
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update task status');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Task deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete task');
    },
  });

  // Reorder tasks mutation
  const reorderTasksMutation = useMutation({
    mutationFn: (orderedIds: string[]) => tasksApi.reorderTasks(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to save reorder');
    },
  });

  return {
    ...tasksQuery,
    tasks: tasksQuery.data?.data || [],
    pagination: tasksQuery.data?.pagination,
    createTask: createTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    updateTask: updateTaskMutation.mutateAsync,
    isUpdating: updateTaskMutation.isPending,
    toggleComplete: toggleCompleteMutation.mutateAsync,
    isToggling: toggleCompleteMutation.isPending,
    deleteTask: deleteTaskMutation.mutateAsync,
    isDeleting: deleteTaskMutation.isPending,
    reorderTasks: reorderTasksMutation.mutateAsync,
  };
};

export const useTask = (id?: string) => {
  const queryClient = useQueryClient();

  const taskQuery = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getTaskById(id!),
    enabled: !!id,
  });

  const subtasksQuery = useQuery({
    queryKey: ['subtasks', id],
    queryFn: () => tasksApi.getSubtasks(id!),
    enabled: !!id,
  });

  const createSubtaskMutation = useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      tasksApi.createSubtask(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({
      taskId,
      subId,
      payload,
    }: {
      taskId: string;
      subId: string;
      payload: { is_completed?: boolean; title?: string };
    }) => tasksApi.updateSubtask(taskId, subId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: ({ taskId, subId }: { taskId: string; subId: string }) =>
      tasksApi.deleteSubtask(taskId, subId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    task: taskQuery.data?.data,
    isLoadingTask: taskQuery.isLoading,
    subtasks: subtasksQuery.data?.data || [],
    isLoadingSubtasks: subtasksQuery.isLoading,
    createSubtask: createSubtaskMutation.mutateAsync,
    updateSubtask: updateSubtaskMutation.mutateAsync,
    deleteSubtask: deleteSubtaskMutation.mutateAsync,
  };
};
