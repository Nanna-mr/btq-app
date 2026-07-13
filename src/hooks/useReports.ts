import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface SaleReportItem {
  id: string;
  sellerId: string;
  sellerName: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  customerPhone: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  openedBy: string;
  openedByName: string;
  openingAmount: number;
  closingAmount: number | null;
  openedAt: string;
  closedAt: string | null;
  note: string;
}

interface SaleRow {
  id: string;
  seller_id: string;
  payment_method: string;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  paid_amount: number | string | null;
  customer_phone: string | null;
  created_at: string;
  users: { full_name: string } | { full_name: string }[] | null;
}

interface CashSessionRow {
  id: string;
  opened_by: string;
  opening_amount: number | string;
  closing_amount: number | string | null;
  opened_at: string;
  closed_at: string | null;
  note: string | null;
  users: { full_name: string } | { full_name: string }[] | null;
}

export interface CashSessionPayload {
  openedBy: string;
  openingAmount: number;
  closingAmount?: number;
  note: string;
}

function relationName(value: { full_name: string } | { full_name: string }[] | null | undefined) {
  return Array.isArray(value) ? value[0]?.full_name ?? '-' : value?.full_name ?? '-';
}

function startOfDay(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfDay(date = new Date()) {
  const end = startOfDay(date);
  end.setDate(end.getDate() + 1);
  return end;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function useSalesReport(period: 'today' | 'month' | 'all' = 'today') {
  return useQuery<SaleReportItem[]>({
    queryKey: ['salesReport', period],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
      }

      let query = supabase
        .from('sales')
        .select('id,seller_id,payment_method,subtotal,discount,tax,total,paid_amount,customer_phone,created_at,users(full_name)')
        .order('created_at', { ascending: false });

      if (period === 'today') {
        query = query.gte('created_at', startOfDay().toISOString()).lt('created_at', endOfDay().toISOString());
      }

      if (period === 'month') {
        query = query.gte('created_at', startOfMonth().toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return ((data ?? []) as unknown as SaleRow[]).map((sale) => ({
        id: sale.id,
        sellerId: sale.seller_id,
        sellerName: relationName(sale.users),
        paymentMethod: sale.payment_method,
        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount),
        tax: Number(sale.tax),
        total: Number(sale.total),
        paidAmount: Number(sale.paid_amount ?? sale.total),
        customerPhone: sale.customer_phone ?? '',
        createdAt: sale.created_at,
      }));
    },
  });
}

export function useCashSessions() {
  return useQuery<CashSession[]>({
    queryKey: ['cashSessions'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('cash_sessions')
        .select('id,opened_by,opening_amount,closing_amount,opened_at,closed_at,note,users(full_name)')
        .order('opened_at', { ascending: false });

      if (error) {
        throw error;
      }

      return ((data ?? []) as unknown as CashSessionRow[]).map((session) => ({
        id: session.id,
        openedBy: session.opened_by,
        openedByName: relationName(session.users),
        openingAmount: Number(session.opening_amount),
        closingAmount: session.closing_amount === null ? null : Number(session.closing_amount),
        openedAt: session.opened_at,
        closedAt: session.closed_at,
        note: session.note ?? '',
      }));
    },
  });
}

export function useCashSessionSales(sessionId?: string) {
  return useQuery<SaleReportItem[]>({
    queryKey: ['cashSessionSales', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      if (!isSupabaseConfigured || !sessionId) {
        return [];
      }

      const { data, error } = await supabase
        .from('sales')
        .select('id,seller_id,payment_method,subtotal,discount,tax,total,paid_amount,customer_phone,created_at,users(full_name)')
        .eq('cash_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return ((data ?? []) as unknown as SaleRow[]).map((sale) => ({
        id: sale.id,
        sellerId: sale.seller_id,
        sellerName: relationName(sale.users),
        paymentMethod: sale.payment_method,
        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount),
        tax: Number(sale.tax),
        total: Number(sale.total),
        paidAmount: Number(sale.paid_amount ?? sale.total),
        customerPhone: sale.customer_phone ?? '',
        createdAt: sale.created_at,
      }));
    },
  });
}

export function useOpenCashSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CashSessionPayload) => {
      const { data, error } = await supabase
        .from('cash_sessions')
        .insert({
          opened_by: payload.openedBy,
          opening_amount: payload.openingAmount,
          note: payload.note || null,
        })
        .select('id,opened_by,opening_amount,closing_amount,opened_at,closed_at,note,users(full_name)')
        .single<CashSessionRow>();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        openedBy: data.opened_by,
        openedByName: relationName(data.users),
        openingAmount: Number(data.opening_amount),
        closingAmount: data.closing_amount === null ? null : Number(data.closing_amount),
        openedAt: data.opened_at,
        closedAt: data.closed_at,
        note: data.note ?? '',
      } satisfies CashSession;
    },
    onSuccess: async (session) => {
      queryClient.setQueryData<CashSession[]>(['cashSessions'], (current = []) => [session, ...current.filter((item) => item.id !== session.id)]);
      await queryClient.invalidateQueries({ queryKey: ['cashSessions'] });
      await queryClient.invalidateQueries({ queryKey: ['cashSessionSales'] });
      await queryClient.invalidateQueries({ queryKey: ['salesReport'] });
    },
  });
}

export function useCloseCashSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, closingAmount, note }: { id: string; closingAmount: number; note: string }) => {
      const { error } = await supabase
        .from('cash_sessions')
        .update({
          closing_amount: closingAmount,
          note: note || null,
          closed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cashSessions'] });
      await queryClient.invalidateQueries({ queryKey: ['cashSessionSales'] });
      await queryClient.invalidateQueries({ queryKey: ['salesReport'] });
    },
  });
}
