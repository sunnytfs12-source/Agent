import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import toast from 'react-hot-toast';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

export const TagModal: React.FC<TagModalProps> = ({ isOpen, onClose }) => {
  const { tags, createTag, deleteTag } = useCategories();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createTag({ name: name.trim().replace(/^#/, ''), color });
      setName('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete tag');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">Manage Tags</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Existing Tags */}
        <div className="my-4 flex max-h-36 flex-wrap gap-2 overflow-y-auto p-1">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
              <span className="text-slate-700 dark:text-slate-200">#{tag.name}</span>
              <button
                onClick={() => handleDelete(tag.id)}
                className="ml-1 text-slate-400 hover:text-red-500"
              >
                <i className="bi bi-x"></i>
              </button>
            </span>
          ))}
        </div>

        {/* Add Tag Form */}
        <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-4 dark:border-slate-800 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Add New Tag</p>

          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tag name (e.g. urgent, frontend)"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase">Select Color</label>
            <div className="mt-1 flex gap-2">
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

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Tag</span>
          </button>
        </form>
      </div>
    </div>
  );
};
