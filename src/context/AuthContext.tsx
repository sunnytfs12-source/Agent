import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedFields: Partial<User>) => void;
  refreshUserProfile: () => Promise<void>;
  toggleTheme: () => void;
}

// ── Apply dark/light class to <html> ─────────────────────────────
export function applyTheme(theme?: string | null) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = theme === 'system' || !theme
    ? (prefersDark ? 'dark' : 'light')
    : theme;
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mscit_user');
    if (!saved) return null;
    try {
      const u = JSON.parse(saved) as User;
      // Apply saved theme immediately on page load — runs before first paint
      applyTheme(u.theme);
      return u;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem('mscit_access_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    const token   = localStorage.getItem('mscit_access_token');
    const refresh = localStorage.getItem('mscit_refresh_token');

    if (!token && !refresh) {
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      setUser(res.data);
      localStorage.setItem('mscit_user', JSON.stringify(res.data));
      applyTheme(res.data.theme);
    } catch (err: any) {
      console.warn('Initial session check failed:', err?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('mscit_access_token');
      localStorage.removeItem('mscit_refresh_token');
      localStorage.removeItem('mscit_user');
      // Revert to system preference on forced logout
      applyTheme('system');
      toast.error('Session expired. Please log in again.');
    };

    window.addEventListener('auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('auth_logout', handleLogoutEvent);
  }, [checkAuth]);

  const handleAuthSuccess = (data: AuthResponse['data']) => {
    setUser(data.user);
    setAccessToken(data.accessToken);
    localStorage.setItem('mscit_user', JSON.stringify(data.user));
    localStorage.setItem('mscit_access_token', data.accessToken);
    localStorage.setItem('mscit_refresh_token', data.refreshToken);
    applyTheme(data.user.theme);
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      handleAuthSuccess(res.data);
      toast.success(`Welcome back, ${res.data.user.name}!`);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Login failed';
      toast.error(msg);
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await authApi.register(name, email, password);
      handleAuthSuccess(res.data);
      toast.success(`Account created! Welcome, ${name}!`);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Registration failed';
      toast.error(msg);
      throw err;
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('mscit_refresh_token') || undefined;
    try {
      await authApi.logout(refreshToken);
    } catch {
      // ignore
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('mscit_access_token');
      localStorage.removeItem('mscit_refresh_token');
      localStorage.removeItem('mscit_user');
      applyTheme('system');
      toast.success('Logged out successfully');
    }
  };

  // updateUser now applies theme immediately — no refresh needed
  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('mscit_user', JSON.stringify(updated));
      if (updatedFields.theme !== undefined) {
        applyTheme(updated.theme);
      }
      return updated;
    });
  };

  // Quick toggle between dark and light without going through ProfilePage
  const toggleTheme = () => {
    setUser((prev) => {
      if (!prev) return null;
      const next = prev.theme === 'dark' ? 'light' : 'dark';
      const updated = { ...prev, theme: next };
      localStorage.setItem('mscit_user', JSON.stringify(updated));
      applyTheme(next);
      // Persist to server in the background (fire-and-forget)
      authApi.updateProfile({ theme: next }).catch(() => {});
      return updated;
    });
  };

  const refreshUserProfile = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data);
      localStorage.setItem('mscit_user', JSON.stringify(res.data));
      applyTheme(res.data.theme);
    } catch {
      // ignored
    }
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isAdmin:        user?.role === 'admin' || user?.role === 'superadmin',
      isSuperAdmin:   user?.role === 'superadmin',
      isLoading,
      login,
      register,
      logout,
      updateUser,
      refreshUserProfile,
      toggleTheme,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, accessToken, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
