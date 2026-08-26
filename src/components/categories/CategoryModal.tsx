import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import toast from 'react-hot-toast';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#64748b', // Slate
];

const PRESET_ICONS = [
  'briefcase',
  'person',
  'book',
  'heart',
  'cash-coin',
  'bag',
  'code-slash',
  'star',
  'check-circle',
  'folder',
];

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose }) => {
  const { categories, createCategory, deleteCategory } = useCategories();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('folder');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createCategory({ name: name.trim(), color, icon });
      setName('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, isDefault?: boolean) => {
    if (isDefault) {
      toast.error('Default system categories cannot be deleted');
      return;
    }
    try {
      await deleteCategory(id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete category');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Manage Categories</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Existing Categories List */}
        <div className="my-4 max-h-40 space-y-1.5 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs dark:bg-slate-800/60"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                {cat.is_default && (
                  <span className="rounded-md bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    Default
                  </span>
                )}
              </div>
              {!cat.is_default && (
                <button
                  onClick={() => handleDelete(cat.id, cat.is_default)}
                  className="text-slate-400 hover:text-red-500 transition p-1"
                >
                  <i className="bi bi-trash"></i>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Create New Category Form */}
        <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-4 dark:border-slate-800 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Add New Category</p>

          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name (e.g. Finance, Goals)"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Color palette */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase">Select Color</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full transition ${
                    color === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase">Select Icon</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition ${
                    icon === ic
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <i className={`bi bi-${ic}`}></i>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <i className="bi bi-plus-lg"></i>
                <span>Add Category</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
