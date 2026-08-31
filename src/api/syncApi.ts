import { apiClient } from './client';

export interface SyncOperation {
  id: string;
  type: 'CREATE_TASK' | 'UPDATE_TASK' | 'DELETE_TASK';
  data: Record<string, any>;
}

export const syncApi = {
  bulkSync: async (
    operations: SyncOperation[]
  ): Promise<{ data: Array<{ id: string; success: boolean }>; processed: number }> => {
    const res = await apiClient.post('/sync/bulk', { operations });
    return res.data;
  },
};
