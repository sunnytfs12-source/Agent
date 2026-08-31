import { apiClient } from './client';
import { AdminDashboardStats, ActivityLogItem, User, PaginatedResponse } from '../types';

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardStats> => {
    const res = await apiClient.get<AdminDashboardStats>('/admin/dashboard');
    return res.data;
  },

  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  } = {}): Promise<PaginatedResponse<User>> => {
    const res = await apiClient.get<PaginatedResponse<User>>('/admin/users', { params });
    return res.data;
  },

  getUserById: async (id: string): Promise<{ data: User & { tasks: any[] } }> => {
    const res = await apiClient.get<{ data: User & { tasks: any[] } }>(`/admin/users/${id}`);
    return res.data;
  },

  createUser: async (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<{ data: User }> => {
    const res = await apiClient.post<{ data: User }>('/admin/users', payload);
    return res.data;
  },

  updateUser: async (
    id: string,
    payload: { name?: string; role?: string; is_active?: boolean; password?: string }
  ): Promise<{ data: User }> => {
    const res = await apiClient.put<{ data: User }>(`/admin/users/${id}`, payload);
    return res.data;
  },

  deleteUser: async (id: string): Promise<{ data: { message: string } }> => {
    const res = await apiClient.delete(`/admin/users/${id}`);
    return res.data;
  },

  getActivityLogs: async (params: {
    page?: number;
    limit?: number;
    user_id?: string;
    entity_type?: string;
  } = {}): Promise<PaginatedResponse<ActivityLogItem>> => {
    const res = await apiClient.get<PaginatedResponse<ActivityLogItem>>(
      '/admin/activity-logs',
      { params }
    );
    return res.data;
  },

  exportSystemSnapshot: async (): Promise<{ data: any }> => {
    const res = await apiClient.get('/admin/export');
    return res.data;
  },
};
