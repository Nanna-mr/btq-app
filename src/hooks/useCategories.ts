import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Category } from '../types/Product';

interface CategoryPayload {
  id?: string;
  name: string;
}

async function saveCategory(payload: CategoryPayload) {
  if (!isSupabaseConfigured) {
    throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
  }

  const name = payload.name.trim();

  if (!name) {
    throw { code: 'category_name_required', message: 'Category name is required' };
  }

  if (payload.id) {
    const { error } = await supabase.from('categories').update({ name }).eq('id', payload.id);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase.from('categories').insert({ name });

  if (error) {
    throw error;
  }
}

async function deleteCategory(categoryId: string) {
  if (!isSupabaseConfigured) {
    throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
  }

  const { error } = await supabase.from('categories').delete().eq('id', categoryId);

  if (error) {
    throw error;
  }
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await supabase.from('categories').select('id,name').order('name');

      if (error) {
        throw error;
      }

      return (data ?? []) as Category[];
    },
  });
}

export function useSaveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
