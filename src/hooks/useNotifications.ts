import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';
import { NotificationItem } from '../types';

export const useNotifications = () => {
  const queryClient = useQueryClient();

  const query = useQuery<{ data: NotificationItem[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(20),
    refetchInterval: 30000, // Check for new notifications every 30s
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: query.data?.data || [],
    unreadCount: query.data?.unreadCount || 0,
    isLoading: query.isLoading,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
  };
};
