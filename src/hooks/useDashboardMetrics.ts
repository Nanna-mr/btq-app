import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface DashboardMetrics {
  revenue: number;
  todaySales: number;
  pendingOrders: number;
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return { revenue: 0, todaySales: 0, pendingOrders: 0 };
      }

      const { start, end } = todayRange();
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total,created_at')
        .gte('created_at', start)
        .lt('created_at', end);

      if (salesError) {
        throw salesError;
      }

      const { count: pendingOrders, error: ordersError } = await supabase
        .from('custom_orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['new', 'in_progress', 'ready']);

      if (ordersError) {
        throw ordersError;
      }

      return {
        revenue: (sales ?? []).reduce((sum, sale) => sum + Number(sale.total ?? 0), 0),
        todaySales: sales?.length ?? 0,
        pendingOrders: pendingOrders ?? 0,
      };
    },
  });
}
