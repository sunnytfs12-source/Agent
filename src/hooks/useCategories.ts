import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/categoriesApi';
import { Category, Tag } from '../types';
import toast from 'react-hot-toast';

export const useCategories = () => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery<{ data: Category[] }>({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  const tagsQuery = useQuery<{ data: Tag[] }>({
    queryKey: ['tags'],
    queryFn: categoriesApi.getTags,
  });

  const createCategoryMutation = useMutation({
    mutationFn: categoriesApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; color?: string; icon?: string } }) =>
      categoriesApi.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Category updated');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Category removed');
    },
  });

  const createTagMutation = useMutation({
    mutationFn: categoriesApi.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created');
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: categoriesApi.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tag removed');
    },
  });

  return {
    categories: categoriesQuery.data?.data || [],
    isLoadingCategories: categoriesQuery.isLoading,
    tags: tagsQuery.data?.data || [],
    isLoadingTags: tagsQuery.isLoading,
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    createTag: createTagMutation.mutateAsync,
    deleteTag: deleteTagMutation.mutateAsync,
  };
};
