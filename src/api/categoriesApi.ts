import { apiClient } from './client';
import { Category, Tag } from '../types';

export const categoriesApi = {
  getCategories: async (): Promise<{ data: Category[] }> => {
    const res = await apiClient.get<{ data: Category[] }>('/categories');
    return res.data;
  },

  createCategory: async (payload: {
    name: string;
    color?: string;
    icon?: string;
  }): Promise<{ data: Category }> => {
    const res = await apiClient.post<{ data: Category }>('/categories', payload);
    return res.data;
  },

  updateCategory: async (
    id: string,
    payload: { name?: string; color?: string; icon?: string }
  ): Promise<{ data: Category }> => {
    const res = await apiClient.put<{ data: Category }>(`/categories/${id}`, payload);
    return res.data;
  },

  deleteCategory: async (id: string): Promise<{ data: { message: string } }> => {
    const res = await apiClient.delete(`/categories/${id}`);
    return res.data;
  },

  getTags: async (): Promise<{ data: Tag[] }> => {
    const res = await apiClient.get<{ data: Tag[] }>('/tags');
    return res.data;
  },

  createTag: async (payload: { name: string; color?: string }): Promise<{ data: Tag }> => {
    const res = await apiClient.post<{ data: Tag }>('/tags', payload);
    return res.data;
  },

  deleteTag: async (id: string): Promise<{ data: { message: string } }> => {
    const res = await apiClient.delete(`/tags/${id}`);
    return res.data;
  },
};
