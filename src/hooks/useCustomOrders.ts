import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { CustomOrder } from '../types/Sale';

interface CustomOrderRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  product_type: string;
  details: string;
  deposit: number | string;
  total_price: number | string;
  due_date: string;
  status: CustomOrder['status'];
  created_by: string | null;
  created_at: string;
}

export interface CustomOrderPayload {
  id?: string;
  customerName: string;
  customerPhone: string;
  productType: string;
  details: string;
  deposit: number;
  totalPrice: number;
  dueDate: string;
  status?: CustomOrder['status'];
  createdBy: string;
}

function mapCustomOrder(row: CustomOrderRow): CustomOrder {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    productType: row.product_type,
    details: row.details,
    deposit: Number(row.deposit),
    totalPrice: Number(row.total_price),
    dueDate: row.due_date,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export function useCustomOrders() {
  return useQuery<CustomOrder[]>({
    queryKey: ['customOrders'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('custom_orders')
        .select('id,customer_name,customer_phone,product_type,details,deposit,total_price,due_date,status,created_by,created_at')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return ((data ?? []) as CustomOrderRow[]).map(mapCustomOrder);
    },
  });
}

export function useCreateCustomOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CustomOrderPayload) => {
      if (!isSupabaseConfigured) {
        throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
      }

      const { error } = await supabase.from('custom_orders').insert({
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        product_type: payload.productType,
        details: payload.details,
        deposit: payload.deposit,
        total_price: payload.totalPrice,
        due_date: payload.dueDate,
        status: 'new',
        created_by: payload.createdBy,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customOrders'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
  });
}

export function useUpdateCustomOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CustomOrderPayload) => {
      if (!isSupabaseConfigured) {
        throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
      }

      if (!payload.id) {
        throw { code: 'custom_order_id_required', message: 'Custom order id is required' };
      }

      const { error } = await supabase
        .from('custom_orders')
        .update({
          customer_name: payload.customerName,
          customer_phone: payload.customerPhone,
          product_type: payload.productType,
          details: payload.details,
          deposit: payload.deposit,
          total_price: payload.totalPrice,
          due_date: payload.dueDate,
          status: payload.status ?? 'new',
        })
        .eq('id', payload.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customOrders'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
  });
}

export function useDeleteCustomOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!isSupabaseConfigured) {
        throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
      }

      const { error } = await supabase.from('custom_orders').delete().eq('id', orderId);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customOrders'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
    },
  });
}
