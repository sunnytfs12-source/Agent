import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { CategoryModal } from '../categories/CategoryModal';
import { TagModal } from '../categories/TagModal';

interface AppLayoutProps {
  selectedCategory?: string;
  onSelectCategory?: (id?: string) => void;
  selectedTag?: string;
  onSelectTag?: (id?: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          selectedTag={selectedTag}
          onSelectTag={onSelectTag}
          onOpenCategoryModal={() => setCategoryModalOpen(true)}
          onOpenTagModal={() => setTagModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {categoryModalOpen && (
        <CategoryModal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} />
      )}
      {tagModalOpen && (
        <TagModal isOpen={tagModalOpen} onClose={() => setTagModalOpen(false)} />
      )}
    </div>
  );
};
