import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { UserRole } from '../types/User';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean | null;
  created_at: string;
}

export function useUsers() {
  return useQuery<ManagedUser[]>({
    queryKey: ['users'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('users')
        .select('id,full_name,email,role,is_active,created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return ((data ?? []) as UserRow[]).map((user) => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        isActive: user.is_active ?? true,
        createdAt: user.created_at,
      }));
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('users').update({ is_active: isActive }).eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('archive_user_account', { target_user_id: userId });

      if (error) {
        throw error;
      }
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData<ManagedUser[]>(['users']);

      queryClient.setQueryData<ManagedUser[]>(['users'], (current = []) =>
        current.map((user) => (user.id === userId ? { ...user, isActive: false } : user)),
      );

      return { previousUsers };
    },
    onError: (_error, _userId, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(['users'], context.previousUsers);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['cashSessions'] });
      await queryClient.invalidateQueries({ queryKey: ['salesReport'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
