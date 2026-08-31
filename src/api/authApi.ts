import { apiClient } from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', { name, email, password });
    return res.data;
  },

  logout: async (refreshToken?: string): Promise<{ data: { message: string } }> => {
    const res = await apiClient.post('/auth/logout', { refreshToken });
    return res.data;
  },

  refresh: async (refreshToken: string): Promise<{ data: { accessToken: string; refreshToken: string } }> => {
    const res = await apiClient.post('/auth/refresh', { refreshToken });
    return res.data;
  },

  getMe: async (): Promise<{ data: User }> => {
    const res = await apiClient.get<{ data: User }>('/auth/me');
    return res.data;
  },

  updateProfile: async (payload: {
    name?: string;
    theme?: string;
    avatar_url?: string | null;
    preferences?: Record<string, any>;
  }): Promise<{ data: User }> => {
    const res = await apiClient.put<{ data: User }>('/auth/profile', payload);
    return res.data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ data: { message: string } }> => {
    const res = await apiClient.put('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};
