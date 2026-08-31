import { Request } from 'express';

// ─────────────────────────────────────────────
// Domain types (mirror frontend src/types)
// ─────────────────────────────────────────────

export type UserRole = 'user' | 'admin' | 'superadmin';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  theme?: string;
  avatar_url?: string | null;
  preferences?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  last_login?: string | null;
  task_count?: number;
  completed_task_count?: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  user_id?: string | null;
  is_default?: boolean;
  task_count?: number;
  created_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id?: string | null;
  is_default?: boolean;
  created_at?: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  completed_at?: string | null;
  order_index: number;
  user_id: string;
  effort_estimate: number;
  ai_suggested?: boolean;
  ai_metadata?: Record<string, any>;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category[];
  tags?: Tag[];
  subtask_count?: number;
  completed_subtasks?: number;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ActivityLogItem {
  id: string;
  user_id?: string | null;
  user_name?: string;
  user_email?: string;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  old_data?: any;
  new_data?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────
// JWT payload stored inside the token
// ─────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

// ─────────────────────────────────────────────
// Express request augmented with auth user
// ─────────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

// ─────────────────────────────────────────────
// Standard API response envelopes
// ─────────────────────────────────────────────
export interface ApiSuccess<T = any> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
