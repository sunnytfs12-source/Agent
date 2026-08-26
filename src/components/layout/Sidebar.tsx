import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCategories } from '../../hooks/useCategories';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory?: string;
  onSelectCategory?: (id?: string) => void;
  selectedTag?: string;
  onSelectTag?: (id?: string) => void;
  onOpenCategoryModal?: () => void;
  onOpenTagModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
  onOpenCategoryModal,
  onOpenTagModal,
}) => {
  const { isAdmin } = useAuth();
  const { categories, tags } = useCategories();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-1 flex-col overflow-y-auto p-4 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Workspace
            </p>

            <NavLink
              to="/"
              end
              onClick={() => {
                if (onSelectCategory) onSelectCategory(undefined);
                if (onSelectTag) onSelectTag(undefined);
                onClose();
              }}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  isActive && !selectedCategory && !selectedTag
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <i className="bi bi-inbox text-base text-indigo-500"></i>
                <span>All Tasks</span>
              </div>
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <i className="bi bi-shield-check text-base text-purple-500"></i>
                  <span>Admin Panel</span>
                </div>
              </NavLink>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Categories
              </p>
              {onOpenCategoryModal && (
                <button
                  onClick={onOpenCategoryModal}
                  className="text-xs text-slate-400 hover:text-indigo-500 transition"
                  title="Add Category"
                >
                  <i className="bi bi-plus-lg"></i>
                </button>
              )}
            </div>

            <div className="space-y-0.5">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory(isSelected ? undefined : cat.id);
                      }
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || '#6366f1' }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    {cat.task_count !== undefined && cat.task_count > 0 && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {cat.task_count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tags</p>
              {onOpenTagModal && (
                <button
                  onClick={onOpenTagModal}
                  className="text-xs text-slate-400 hover:text-indigo-500 transition"
                  title="Add Tag"
                >
                  <i className="bi bi-plus-lg"></i>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 px-3 pt-1">
              {tags.map((tag) => {
                const isSelected = selectedTag === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() => {
                      if (onSelectTag) {
                        onSelectTag(isSelected ? undefined : tag.id);
                      }
                    }}
                    className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: isSelected ? '#ffffff' : tag.color || '#10b981' }}
                    />
                    <span>#{tag.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info: Dual Mode Indicator */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">Dual DB Active</span>
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
              v1.0.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
