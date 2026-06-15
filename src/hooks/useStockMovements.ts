import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { ProductVariant, StockMovement } from '../types/Product';

export interface StockMovementPayload {
  variantId: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  note: string;
}

interface VariantRow {
  id: string;
  product_id: string;
  sku: string;
  color: string;
  size: string;
  products: { name: string } | { name: string }[] | null;
}

interface MovementRow {
  id: string;
  variant_id: string;
  movement_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  note: string | null;
  created_at: string;
  product_variants: {
    sku: string;
    products: { name: string } | { name: string }[] | null;
  } | null;
}

function relationName(value: { name: string } | { name: string }[] | null | undefined) {
  return Array.isArray(value) ? value[0]?.name ?? 'Produit' : value?.name ?? 'Produit';
}

function saleIdFromNote(note: string | null) {
  return note?.match(/Vente\s+([0-9a-f-]{36})/i)?.[1] ?? null;
}

export function useProductVariants() {
  return useQuery<ProductVariant[]>({
    queryKey: ['productVariants'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('product_variants')
        .select('id,product_id,sku,color,size,products(name)')
        .order('sku');

      if (error) {
        throw error;
      }

      const { data: stockRows, error: stockError } = await supabase
        .from('v_current_stock')
        .select('variant_id,current_stock');

      if (stockError) {
        throw stockError;
      }

      const stockByVariant = new Map<string, number>();

      for (const row of stockRows ?? []) {
        stockByVariant.set(String(row.variant_id), Number(row.current_stock ?? 0));
      }

      return ((data ?? []) as unknown as VariantRow[]).map((variant) => ({
        id: variant.id,
        productId: variant.product_id,
        productName: relationName(variant.products),
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        stock: stockByVariant.get(variant.id) ?? 0,
      }));
    },
  });
}

export function useStockMovements() {
  return useQuery<StockMovement[]>({
    queryKey: ['stockMovements'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await supabase
        .from('stock_movements')
        .select('id,variant_id,movement_type,quantity,note,created_at,product_variants(sku,products(name))')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return ((data ?? []) as unknown as MovementRow[]).map((movement) => ({
        id: movement.id,
        variantId: movement.variant_id,
        sku: movement.product_variants?.sku ?? '',
        productName: relationName(movement.product_variants?.products),
        movementType: movement.movement_type,
        quantity: movement.quantity,
        note: movement.note ?? '',
        createdAt: movement.created_at,
        saleId: saleIdFromNote(movement.note),
      }));
    },
  });
}

export function useAddStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StockMovementPayload) => {
      const { error } = await supabase.from('stock_movements').insert({
        variant_id: payload.variantId,
        movement_type: payload.movementType,
        quantity: payload.quantity,
        unit_cost: 0,
        note: payload.note,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      await queryClient.invalidateQueries({ queryKey: ['productVariants'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
