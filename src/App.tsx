import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TasksPage } from './pages/TasksPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | undefined>();

  return (
    <AuthProvider>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Application Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
              />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={
              <TasksPage
                selectedCategory={selectedCategory}
                selectedTag={selectedTag}
              />
            }
          />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin Portal (Protected with adminOnly) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
