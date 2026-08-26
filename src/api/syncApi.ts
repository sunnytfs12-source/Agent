import { apiClient } from './client';

export interface SyncOperation {
  id: string;
  type: 'CREATE_TASK' | 'UPDATE_TASK' | 'DELETE_TASK';
  data: Record<string, any>;
}

// ── MOCK MODE ──────────────────────────────────────────────────────────────
export { mockSyncApi as syncApi } from './localMock';
// ── REAL IMPLEMENTATION (uncomment when backend is ready) ──────────────────
// export const syncApi = {
//   bulkSync: async (operations: SyncOperation[]) => {
//     const res = await apiClient.post('/sync/bulk', { operations });
//     return res.data;
//   },
// };
