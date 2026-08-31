import { apiClient } from './client';
import { NotificationItem } from '../types';

export const notificationsApi = {
  getNotifications: async (
    limit = 20
  ): Promise<{ data: NotificationItem[]; unreadCount: number }> => {
    const res = await apiClient.get<{ data: NotificationItem[]; unreadCount: number }>(
      '/notifications',
      { params: { limit } }
    );
    return res.data;
  },

  markRead: async (id: string): Promise<{ data: { message: string } }> => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async (): Promise<{ data: { message: string } }> => {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data;
  },
};
