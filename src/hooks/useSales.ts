import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { CartLine } from '../stores/cartStore';
import type { SaleTicket } from '../lib/tickets';

export interface CheckoutPayload {
  sellerId: string;
  cashSessionId: string;
  items: CartLine[];
  paymentMethod: 'cash' | 'bankily' | 'sedad' | 'card';
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  customerPhone: string;
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

interface SaleRow {
  id: string;
  seller_id: string;
  payment_method: string;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  paid_amount: number | string;
  customer_phone: string | null;
  created_at: string;
}

interface SaleItemRow {
  variant_id: string;
  quantity: number;
  unit_price: number | string;
  product_variants: {
    sku: string;
    product_id: string;
    products: { name: string; image_url: string | null } | { name: string; image_url: string | null }[] | null;
  } | null;
}

function productRelation(value: SaleItemRow['product_variants']) {
  const product = Array.isArray(value?.products) ? value?.products[0] : value?.products;
  return {
    name: product?.name ?? 'Produit',
    imageUrl: product?.image_url ?? '',
  };
}

export async function fetchSaleTicket(saleId: string): Promise<SaleTicket> {
  if (!isSupabaseConfigured) {
    throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('id,seller_id,payment_method,subtotal,discount,tax,total,paid_amount,customer_phone,created_at')
    .eq('id', saleId)
    .single<SaleRow>();

  if (saleError || !sale) {
    throw saleError ?? { code: 'sale_not_found', message: 'Sale not found' };
  }

  const { data: seller } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', sale.seller_id)
    .maybeSingle<{ full_name: string }>();

  const { data: rows, error: itemsError } = await supabase
    .from('sale_items')
    .select('variant_id,quantity,unit_price,product_variants(sku,product_id,products(name,image_url))')
    .eq('sale_id', saleId);

  if (itemsError) {
    throw itemsError;
  }

  const items: CartLine[] = ((rows ?? []) as unknown as SaleItemRow[]).map((item) => {
    const product = productRelation(item.product_variants);
    return {
      productId: item.product_variants?.product_id ?? '',
      variantId: item.variant_id,
      name: product.name,
      sku: item.product_variants?.sku ?? '',
      imageUrl: product.imageUrl,
      unitPrice: Number(item.unit_price),
      stock: 0,
      quantity: item.quantity,
    };
  });

  return {
    id: sale.id,
    sellerName: seller?.full_name ?? '',
    paymentMethod: sale.payment_method,
    customerPhone: sale.customer_phone ?? '',
    items,
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    tax: Number(sale.tax),
    total: Number(sale.total),
    paidAmount: Number(sale.paid_amount),
    createdAt: sale.created_at,
  };
}

export function useTodaySalesCount() {
  return useQuery<number>({
    queryKey: ['todaySalesCount'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return 0;
      }

      const { start, end } = todayRange();
      const { count, error } = await supabase
        .from('sales')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start)
        .lt('created_at', end);

      if (error) {
        throw error;
      }

      return count ?? 0;
    },
  });
}

export function useCheckoutSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CheckoutPayload): Promise<SaleTicket> => {
      if (!isSupabaseConfigured) {
        throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
      }

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          seller_id: payload.sellerId,
          status: 'paid',
          payment_method: payload.paymentMethod,
          subtotal: payload.subtotal,
          discount: payload.discount,
          tax: payload.tax,
          total: payload.total,
          paid_amount: payload.paidAmount,
          customer_phone: payload.customerPhone || null,
          cash_session_id: payload.cashSessionId,
        })
        .select('id,created_at')
        .single();

      if (saleError || !sale) {
        throw saleError ?? { code: 'sale_create_failed', message: 'Sale create failed' };
      }

      const saleItems = payload.items.map((item) => ({
        sale_id: sale.id,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: 0,
        total: item.unitPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);

      if (itemsError) {
        throw itemsError;
      }

      const stockMovements = payload.items.map((item) => ({
        variant_id: item.variantId,
        movement_type: 'out',
        quantity: item.quantity,
        unit_cost: 0,
        note: `Vente ${sale.id}${payload.customerPhone ? ` - ${payload.customerPhone}` : ''}`,
        created_by: payload.sellerId,
        cash_session_id: payload.cashSessionId,
      }));

      const { error: stockError } = await supabase.from('stock_movements').insert(stockMovements);

      if (stockError) {
        throw stockError;
      }

      return {
        id: sale.id as string,
        sellerName: '',
        paymentMethod: payload.paymentMethod,
        customerPhone: payload.customerPhone,
        items: payload.items,
        subtotal: payload.subtotal,
        discount: payload.discount,
        tax: payload.tax,
        total: payload.total,
        paidAmount: payload.paidAmount,
        createdAt: String(sale.created_at),
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      await queryClient.invalidateQueries({ queryKey: ['todaySalesCount'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] });
      await queryClient.invalidateQueries({ queryKey: ['cashSessions'] });
      await queryClient.invalidateQueries({ queryKey: ['cashSessionSales'] });
    },
  });
}
