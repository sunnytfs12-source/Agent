/**
 * LOCAL MOCK DATABASE
 * -------------------
 * Implements all API method signatures using localStorage.
 * To switch to the real backend later, revert the imports
 * in authApi.ts, tasksApi.ts, etc. to use apiClient instead.
 */

import {
  User,
  AuthResponse,
  Task,
  Subtask,
  Category,
  Tag,
  TaskFilters,
  CreateTaskPayload,
  UpdateTaskPayload,
  PaginatedResponse,
  NotificationItem,
  ActivityLogItem,
  AdminDashboardStats,
  AiParsedTask,
  AiSuggestion,
  TaskStatus,
  TaskPriority,
} from '../types';
import { SyncOperation } from './syncApi';

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function nowStr(): string {
  return new Date().toISOString();
}
function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function writeLS<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- Users ----
export function getUsers(): User[] { return readLS<User[]>('mock_users', []); }
function saveUsers(u: User[]) { writeLS('mock_users', u); }
function getUserByEmail(e: string) { return getUsers().find((u) => u.email === e); }
function getUserById(id: string) { return getUsers().find((u) => u.id === id); }

function getPasswords(): Record<string, string> { return readLS('mock_passwords', {}); }
function savePassword(email: string, password: string) {
  const p = getPasswords(); p[email] = password; writeLS('mock_passwords', p);
}

function makeTokens(uid: string) {
  return { accessToken: `mock_access_${uid}_${Date.now()}`, refreshToken: `mock_refresh_${uid}_${Date.now()}` };
}

// ---- Tasks ----
function getTasks(uid: string): Task[] { return readLS<Task[]>(`mock_tasks_${uid}`, []); }
function saveTasks(uid: string, tasks: Task[]) { writeLS(`mock_tasks_${uid}`, tasks); }

// ---- Categories / Tags ----
const DEF_CATS: Category[] = [
  { id: 'cat-work', name: 'Work', color: '#6366f1', icon: 'briefcase', is_default: true, task_count: 0 },
  { id: 'cat-personal', name: 'Personal', color: '#10b981', icon: 'person', is_default: true, task_count: 0 },
  { id: 'cat-study', name: 'Study', color: '#f59e0b', icon: 'book', is_default: true, task_count: 0 },
];
const DEF_TAGS: Tag[] = [
  { id: 'tag-urgent', name: 'urgent', color: '#ef4444', is_default: true },
  { id: 'tag-review', name: 'review', color: '#8b5cf6', is_default: true },
];
function getCategories(uid: string) { return readLS<Category[]>(`mock_cats_${uid}`, DEF_CATS); }
function saveCategories(uid: string, c: Category[]) { writeLS(`mock_cats_${uid}`, c); }
function getTags(uid: string) { return readLS<Tag[]>(`mock_tags_${uid}`, DEF_TAGS); }
function saveTags(uid: string, t: Tag[]) { writeLS(`mock_tags_${uid}`, t); }

// ---- Notifications ----
function getNotifs(uid: string) { return readLS<NotificationItem[]>(`mock_notifs_${uid}`, []); }
function saveNotifs(uid: string, n: NotificationItem[]) { writeLS(`mock_notifs_${uid}`, n); }

// ---- Current user ----
function currentUserId(): string {
  const u = localStorage.getItem('mscit_user');
  if (!u) throw { response: { status: 401 } };
  return (JSON.parse(u) as User).id;
}

// ============================================================
// AUTH
// ============================================================
export const mockAuthApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    await delay();
    const user = getUserByEmail(email);
    if (!user) throw { response: { data: { error: 'No account found with that email.' } } };
    if (getPasswords()[email] !== password) throw { response: { data: { error: 'Incorrect password.' } } };
    return { data: { user, ...makeTokens(user.id) } };
  },

  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    await delay();
    if (getUserByEmail(email)) throw { response: { data: { error: 'An account with this email already exists.' } } };
    const user: User = { id: uuid(), name, email, role: 'user', is_active: true, theme: 'dark', created_at: nowStr() };
    const users = getUsers(); users.push(user); saveUsers(users);
    savePassword(email, password);
    const notifs = getNotifs(user.id);
    notifs.unshift({ id: uuid(), user_id: user.id, type: 'welcome', title: 'Welcome to MSCIT Todo! 🎉', message: 'Start by creating your first task.', is_read: false, created_at: nowStr() });
    saveNotifs(user.id, notifs);
    return { data: { user, ...makeTokens(user.id) } };
  },

  logout: async (_refreshToken?: string): Promise<{ data: { message: string } }> => { await delay(100); return { data: { message: 'Logged out.' } }; },

  getMe: async (): Promise<{ data: User }> => {
    await delay(100);
    const s = localStorage.getItem('mscit_user');
    if (!s) throw { response: { status: 401 } };
    return { data: JSON.parse(s) as User };
  },

  updateProfile: async (payload: { name?: string; theme?: string; avatar_url?: string | null; preferences?: Record<string, any> }): Promise<{ data: User }> => {
    await delay();
    const s = localStorage.getItem('mscit_user'); if (!s) throw { response: { status: 401 } };
    const user: User = { ...JSON.parse(s), ...payload };
    saveUsers(getUsers().map((u) => (u.id === user.id ? user : u)));
    localStorage.setItem('mscit_user', JSON.stringify(user));
    return { data: user };
  },

  changePassword: async (_cur: string, newPw: string): Promise<{ data: { message: string } }> => {
    await delay();
    const s = localStorage.getItem('mscit_user'); if (!s) throw { response: { status: 401 } };
    savePassword((JSON.parse(s) as User).email, newPw);
    return { data: { message: 'Password updated.' } };
  },
};

// ============================================================
// TASKS
// ============================================================
export const mockTasksApi = {
  getTasks: async (filters: TaskFilters = {}): Promise<PaginatedResponse<Task>> => {
    await delay();
    const uid = currentUserId();
    let tasks = getTasks(uid).filter((t) => !t.is_deleted);
    if (filters.status && filters.status !== 'all') tasks = tasks.filter((t) => t.status === filters.status);
    if (filters.priority && filters.priority !== 'all') tasks = tasks.filter((t) => t.priority === filters.priority);
    if (filters.search) { const q = filters.search.toLowerCase(); tasks = tasks.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)); }
    if (filters.category_id) tasks = tasks.filter((t) => t.categories?.some((c) => c.id === filters.category_id));
    if (filters.tag_id) tasks = tasks.filter((t) => t.tags?.some((tg) => tg.id === filters.tag_id));
    const total = tasks.length; const page = filters.page ?? 1; const limit = filters.limit ?? 20;
    return { data: tasks.slice((page - 1) * limit, page * limit), pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } };
  },

  getTaskById: async (id: string): Promise<{ data: Task }> => {
    await delay();
    const t = getTasks(currentUserId()).find((t) => t.id === id);
    if (!t) throw { response: { status: 404 } };
    return { data: t };
  },

  createTask: async (payload: CreateTaskPayload): Promise<{ data: Task }> => {
    await delay();
    const uid = currentUserId();
    const cats = payload.category_ids ? getCategories(uid).filter((c) => payload.category_ids!.includes(c.id)) : [];
    const tagList = payload.tag_ids ? getTags(uid).filter((t) => payload.tag_ids!.includes(t.id)) : [];
    const tasks = getTasks(uid);
    const task: Task = { id: uuid(), title: payload.title, description: payload.description ?? null, status: 'pending', priority: payload.priority ?? 'medium', due_date: payload.due_date ?? null, completed_at: null, order_index: tasks.length, user_id: uid, effort_estimate: payload.effort_estimate ?? 1, created_at: nowStr(), updated_at: nowStr(), categories: cats, tags: tagList, subtask_count: 0, completed_subtasks: 0 };
    tasks.push(task); saveTasks(uid, tasks);
    return { data: task };
  },

  updateTask: async (id: string, payload: UpdateTaskPayload): Promise<{ data: Task }> => {
    await delay();
    const uid = currentUserId(); let tasks = getTasks(uid);
    const idx = tasks.findIndex((t) => t.id === id); if (idx === -1) throw { response: { status: 404 } };
    const cats = payload.category_ids ? getCategories(uid).filter((c) => payload.category_ids!.includes(c.id)) : tasks[idx].categories;
    const tagList = payload.tag_ids ? getTags(uid).filter((t) => payload.tag_ids!.includes(t.id)) : tasks[idx].tags;
    tasks[idx] = { ...tasks[idx], ...payload, categories: cats, tags: tagList, updated_at: nowStr() };
    saveTasks(uid, tasks); return { data: tasks[idx] };
  },

  toggleComplete: async (id: string): Promise<{ data: Task }> => {
    await delay();
    const uid = currentUserId(); let tasks = getTasks(uid);
    const idx = tasks.findIndex((t) => t.id === id); if (idx === -1) throw { response: { status: 404 } };
    const done = tasks[idx].status === 'completed';
    tasks[idx] = { ...tasks[idx], status: done ? 'pending' : 'completed', completed_at: done ? null : nowStr(), updated_at: nowStr() };
    saveTasks(uid, tasks); return { data: tasks[idx] };
  },

  deleteTask: async (id: string): Promise<{ data: { message: string } }> => {
    await delay();
    const uid = currentUserId();
    saveTasks(uid, getTasks(uid).map((t) => t.id === id ? { ...t, is_deleted: true, updated_at: nowStr() } : t));
    return { data: { message: 'Task deleted.' } };
  },

  reorderTasks: async (orderedIds: string[]): Promise<{ data: { message: string } }> => {
    await delay(100);
    const uid = currentUserId(); let tasks = getTasks(uid);
    orderedIds.forEach((id, i) => { const idx = tasks.findIndex((t) => t.id === id); if (idx !== -1) tasks[idx] = { ...tasks[idx], order_index: i }; });
    saveTasks(uid, tasks); return { data: { message: 'Reordered.' } };
  },

  getSubtasks: async (taskId: string): Promise<{ data: Subtask[] }> => {
    await delay(); const uid = currentUserId();
    return { data: readLS<Subtask[]>(`mock_sub_${uid}_${taskId}`, []) };
  },

  createSubtask: async (taskId: string, title: string): Promise<{ data: Subtask }> => {
    await delay(); const uid = currentUserId(); const key = `mock_sub_${uid}_${taskId}`;
    const subs = readLS<Subtask[]>(key, []);
    const sub: Subtask = { id: uuid(), task_id: taskId, title, is_completed: false, order_index: subs.length, created_at: nowStr(), updated_at: nowStr() };
    subs.push(sub); writeLS(key, subs);
    const tasks = getTasks(uid); const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) { tasks[idx] = { ...tasks[idx], subtask_count: subs.length }; saveTasks(uid, tasks); }
    return { data: sub };
  },

  updateSubtask: async (taskId: string, subId: string, payload: { is_completed?: boolean; title?: string }): Promise<{ data: Subtask }> => {
    await delay(); const uid = currentUserId(); const key = `mock_sub_${uid}_${taskId}`;
    let subs = readLS<Subtask[]>(key, []); const idx = subs.findIndex((s) => s.id === subId); if (idx === -1) throw { response: { status: 404 } };
    subs[idx] = { ...subs[idx], ...payload, updated_at: nowStr() }; writeLS(key, subs);
    const tasks = getTasks(uid); const tIdx = tasks.findIndex((t) => t.id === taskId);
    if (tIdx !== -1) { tasks[tIdx] = { ...tasks[tIdx], completed_subtasks: subs.filter((s) => s.is_completed).length }; saveTasks(uid, tasks); }
    return { data: subs[idx] };
  },

  deleteSubtask: async (taskId: string, subId: string): Promise<{ data: { message: string } }> => {
    await delay(); const uid = currentUserId(); const key = `mock_sub_${uid}_${taskId}`;
    const subs = readLS<Subtask[]>(key, []).filter((s) => s.id !== subId); writeLS(key, subs);
    const tasks = getTasks(uid); const tIdx = tasks.findIndex((t) => t.id === taskId);
    if (tIdx !== -1) { tasks[tIdx] = { ...tasks[tIdx], subtask_count: subs.length }; saveTasks(uid, tasks); }
    return { data: { message: 'Subtask deleted.' } };
  },

  exportSnapshot: async (): Promise<{ data: any }> => { await delay(); return { data: { tasks: getTasks(currentUserId()) } }; },
};

// ============================================================
// CATEGORIES
// ============================================================
export const mockCategoriesApi = {
  getCategories: async (): Promise<{ data: Category[] }> => { await delay(); return { data: getCategories(currentUserId()) }; },
  createCategory: async (p: { name: string; color?: string; icon?: string }): Promise<{ data: Category }> => {
    await delay(); const uid = currentUserId(); const cats = getCategories(uid);
    const cat: Category = { id: uuid(), name: p.name, color: p.color ?? '#6366f1', icon: p.icon ?? 'folder', user_id: uid, is_default: false, task_count: 0, created_at: nowStr() };
    cats.push(cat); saveCategories(uid, cats); return { data: cat };
  },
  updateCategory: async (id: string, p: { name?: string; color?: string; icon?: string }): Promise<{ data: Category }> => {
    await delay(); const uid = currentUserId(); const cats = getCategories(uid);
    const idx = cats.findIndex((c) => c.id === id); if (idx === -1) throw { response: { status: 404 } };
    cats[idx] = { ...cats[idx], ...p }; saveCategories(uid, cats); return { data: cats[idx] };
  },
  deleteCategory: async (id: string): Promise<{ data: { message: string } }> => {
    await delay(); const uid = currentUserId(); saveCategories(uid, getCategories(uid).filter((c) => c.id !== id)); return { data: { message: 'Deleted.' } };
  },
  getTags: async (): Promise<{ data: Tag[] }> => { await delay(); return { data: getTags(currentUserId()) }; },
  createTag: async (p: { name: string; color?: string }): Promise<{ data: Tag }> => {
    await delay(); const uid = currentUserId(); const tags = getTags(uid);
    const tag: Tag = { id: uuid(), name: p.name, color: p.color ?? '#8b5cf6', user_id: uid, is_default: false, created_at: nowStr() };
    tags.push(tag); saveTags(uid, tags); return { data: tag };
  },
  deleteTag: async (id: string): Promise<{ data: { message: string } }> => {
    await delay(); const uid = currentUserId(); saveTags(uid, getTags(uid).filter((t) => t.id !== id)); return { data: { message: 'Deleted.' } };
  },
};

// ============================================================
// NOTIFICATIONS
// ============================================================
export const mockNotificationsApi = {
  getNotifications: async (limit = 20): Promise<{ data: NotificationItem[]; unreadCount: number }> => {
    await delay(); const uid = currentUserId(); const items = getNotifs(uid).slice(0, limit);
    return { data: items, unreadCount: items.filter((n) => !n.is_read).length };
  },
  markRead: async (id: string): Promise<{ data: { message: string } }> => {
    await delay(100); const uid = currentUserId();
    saveNotifs(uid, getNotifs(uid).map((n) => n.id === id ? { ...n, is_read: true } : n));
    return { data: { message: 'Marked read.' } };
  },
  markAllRead: async (): Promise<{ data: { message: string } }> => {
    await delay(100); const uid = currentUserId();
    saveNotifs(uid, getNotifs(uid).map((n) => ({ ...n, is_read: true }))); return { data: { message: 'All read.' } };
  },
};

// ============================================================
// ADMIN
// ============================================================
export const mockAdminApi = {
  getDashboard: async (): Promise<AdminDashboardStats> => {
    await delay(); const uid = currentUserId(); const tasks = getTasks(uid);
    return { stats: { totalUsers: getUsers().length, totalTasks: tasks.length, completedTasks: tasks.filter((t) => t.status === 'completed').length, pendingTasks: tasks.filter((t) => t.status === 'pending').length, completionRate: tasks.length ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100) : 0, activeUsersToday: 1 }, recentActivity: [], priorityBreakdown: (['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => ({ priority: p, count: tasks.filter((t) => t.priority === p).length })), categoryBreakdown: getCategories(uid).map((c) => ({ name: c.name, color: c.color, task_count: tasks.filter((t) => t.categories?.some((x) => x.id === c.id)).length })) };
  },
  getUsers: async (_params: { page?: number; limit?: number; search?: string; role?: string } = {}): Promise<PaginatedResponse<User>> => { await delay(); const u = getUsers(); return { data: u, pagination: { total: u.length, page: 1, limit: 50, totalPages: 1 } }; },
  getUserById: async (id: string): Promise<{ data: User & { tasks: any[] } }> => { await delay(); const u = getUserById(id); if (!u) throw { response: { status: 404 } }; return { data: { ...u, tasks: getTasks(id) } }; },
  createUser: async (p: { name: string; email: string; password: string; role?: string }): Promise<{ data: User }> => {
    await delay(); if (getUserByEmail(p.email)) throw { response: { data: { error: 'Email in use.' } } };
    const user: User = { id: uuid(), name: p.name, email: p.email, role: (p.role as any) ?? 'user', is_active: true, created_at: nowStr() };
    const users = getUsers(); users.push(user); saveUsers(users); savePassword(p.email, p.password); return { data: user };
  },
  updateUser: async (id: string, p: { name?: string; role?: string; is_active?: boolean; password?: string }): Promise<{ data: User }> => {
    await delay(); const users = getUsers(); const idx = users.findIndex((u) => u.id === id); if (idx === -1) throw { response: { status: 404 } };
    users[idx] = { ...users[idx], ...p } as User; saveUsers(users); if (p.password) savePassword(users[idx].email, p.password); return { data: users[idx] };
  },
  deleteUser: async (id: string): Promise<{ data: { message: string } }> => { await delay(); saveUsers(getUsers().filter((u) => u.id !== id)); return { data: { message: 'Deleted.' } }; },
  getActivityLogs: async (_params: { page?: number; limit?: number; user_id?: string; entity_type?: string } = {}): Promise<PaginatedResponse<ActivityLogItem>> => { await delay(); return { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } }; },
  exportSystemSnapshot: async (): Promise<{ data: any }> => { await delay(); return { data: { users: getUsers() } }; },
};

// ============================================================
// AI
// ============================================================
export const mockAiApi = {
  checkHealth: async () => { await delay(100); return { available: false, reason: 'AI not available in mock mode.' }; },
  parseTask: async (input: string): Promise<{ data: AiParsedTask; input: string }> => {
    await delay(); const l = input.toLowerCase();
    const priority: TaskPriority = l.includes('urgent') ? 'urgent' : l.includes('high') ? 'high' : l.includes('low') ? 'low' : 'medium';
    return { data: { title: input, priority, effort_estimate: 1 }, input };
  },
  getSuggestions: async (): Promise<{ data: AiSuggestion[] }> => { await delay(); return { data: [] }; },
  prioritizeTasks: async (): Promise<{ data: Task[] }> => { await delay(); return { data: [] }; },
  breakdownTask: async (title: string, _description?: string, _taskId?: string): Promise<{ data: string[] }> => { await delay(); return { data: [`Research ${title}`, `Plan ${title}`, `Execute ${title}`, `Review ${title}`] }; },
};

// ============================================================
// SYNC
// ============================================================
export const mockSyncApi = {
  bulkSync: async (ops: SyncOperation[]): Promise<{ data: Array<{ id: string; success: boolean }>; processed: number }> => {
    await delay(); return { data: ops.map((o) => ({ id: o.id, success: true })), processed: ops.length };
  },
};
