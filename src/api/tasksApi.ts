// ── MOCK MODE ──────────────────────────────────────────────────────────────
export { mockTasksApi as tasksApi } from './localMock';
// ── REAL IMPLEMENTATION (uncomment when backend is ready) ──────────────────
// import { apiClient } from './client';
// import { Task, Subtask, TaskFilters, CreateTaskPayload, UpdateTaskPayload, PaginatedResponse } from '../types';
// export const tasksApi = { ... };
