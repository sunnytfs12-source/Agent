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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mscit_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem('mscit_access_token')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and verify session on boot
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('mscit_access_token');
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
    } catch (err: any) {
      console.warn('Initial session check failed:', err?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen to window logout event from axios client
    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('mscit_access_token');
      localStorage.removeItem('mscit_refresh_token');
      localStorage.removeItem('mscit_user');
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
    } catch (err) {
      // Ignore error on logout
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('mscit_access_token');
      localStorage.removeItem('mscit_refresh_token');
      localStorage.removeItem('mscit_user');
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('mscit_user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUserProfile = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data);
      localStorage.setItem('mscit_user', JSON.stringify(res.data));
    } catch {
      // Ignored
    }
  };

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: !!user && !!accessToken,
      isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
      isSuperAdmin: user?.role === 'superadmin',
      isLoading,
      login,
      register,
      logout,
      updateUser,
      refreshUserProfile,
    }),
    [user, accessToken, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
