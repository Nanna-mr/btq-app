import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockProducts } from '../data/mockProducts';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Product, ProductFormPayload, ProductVariant } from '../types/Product';

interface ProductRow {
  id: string;
  name: string;
  price: number | string;
  purchase_price: number | string;
  description: string | null;
  image_url: string | null;
  categories: { name: string } | { name: string }[] | null;
}

interface VariantRow {
  id: string;
  product_id: string;
  sku: string;
  color: string;
  size: string;
}

interface StockRow {
  variant_id: string;
  product_id: string;
  current_stock: number | string;
}

interface ExistingVariantRow {
  id: string;
  sku: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=240&q=80';
const PRODUCT_BUCKET = 'boutique';

function categoryName(categories: ProductRow['categories']) {
  return Array.isArray(categories) ? categories[0]?.name ?? 'Sans catégorie' : categories?.name ?? 'Sans catégorie';
}

async function getCategoryId(name: string) {
  const normalizedName = name.trim();
  const { data: existing, error: selectError } = await supabase
    .from('categories')
    .select('id')
    .eq('name', normalizedName)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existing?.id) {
    return existing.id as string;
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ name: normalizedName })
    .select('id')
    .single();

  if (error || !data) {
    throw error ?? { code: 'category_create_failed', message: 'Category create failed' };
  }

  return data.id as string;
}

async function currentStockForVariants(variantIds: string[]) {
  if (variantIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from('v_current_stock')
    .select('variant_id,current_stock')
    .in('variant_id', variantIds);

  if (error) {
    throw error;
  }

  const stockByVariant = new Map<string, number>();

  for (const row of data ?? []) {
    stockByVariant.set(String(row.variant_id), Number(row.current_stock ?? 0));
  }

  return stockByVariant;
}

async function addStockAdjustment(variantId: string, currentStock: number, targetStock: number) {
  const delta = targetStock - currentStock;

  if (delta === 0) {
    return;
  }

  const { error } = await supabase.from('stock_movements').insert({
    variant_id: variantId,
    movement_type: delta > 0 ? 'in' : 'adjustment',
    quantity: Math.abs(delta),
    unit_cost: 0,
    note: 'Ajustement stock produit',
  });

  if (error) {
    throw error;
  }
}

async function syncVariants(productId: string, variants: ProductFormPayload['variants']) {
  const { data: existingRows, error: existingError } = await supabase
    .from('product_variants')
    .select('id,sku')
    .eq('product_id', productId);

  if (existingError) {
    throw existingError;
  }

  const existingVariants = ((existingRows ?? []) as ExistingVariantRow[]);
  const existingById = new Map(existingVariants.map((variant) => [variant.id, variant]));
  const existingBySku = new Map(existingVariants.map((variant) => [variant.sku, variant]));
  const stockByVariant = await currentStockForVariants(existingVariants.map((variant) => variant.id));
  const keptVariantIds = new Set<string>();

  for (const variant of variants) {
    const existingVariant = variant.id ? existingById.get(variant.id) : existingBySku.get(variant.sku);

    if (existingVariant) {
      const { error } = await supabase
        .from('product_variants')
        .update({
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
        })
        .eq('id', existingVariant.id);

      if (error) {
        throw error;
      }

      keptVariantIds.add(existingVariant.id);
      await addStockAdjustment(existingVariant.id, stockByVariant.get(existingVariant.id) ?? 0, variant.stock);
      continue;
    }

    const { data, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw error ?? { code: 'variant_create_failed', message: 'Variant create failed' };
    }

    keptVariantIds.add(data.id as string);
    await addStockAdjustment(data.id as string, 0, variant.stock);
  }

  const removedVariantIds = existingVariants
    .map((variant) => variant.id)
    .filter((variantId) => !keptVariantIds.has(variantId));

  if (removedVariantIds.length > 0) {
    const { error } = await supabase.from('product_variants').delete().in('id', removedVariantIds);

    if (error) {
      throw error;
    }
  }
}

async function saveProduct(payload: ProductFormPayload) {
  if (!isSupabaseConfigured) {
    throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
  }

  const categoryId = await getCategoryId(payload.category);

  if (payload.id) {
    const { error } = await supabase
      .from('products')
      .update({
        category_id: categoryId,
        name: payload.name,
        description: payload.description,
        price: payload.price,
        purchase_price: payload.purchasePrice,
        image_url: payload.imageUrl || null,
      })
      .eq('id', payload.id);

    if (error) {
      throw error;
    }

    await syncVariants(payload.id, payload.variants);
    return;
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      category_id: categoryId,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      purchase_price: payload.purchasePrice,
      image_url: payload.imageUrl || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw error ?? { code: 'product_create_failed', message: 'Product create failed' };
  }

  await syncVariants(data.id as string, payload.variants);
}

async function uploadProductImage(file: File) {
  if (!isSupabaseConfigured) {
    throw { code: 'supabase_not_configured', message: 'Supabase is not configured' };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `products/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(PRODUCT_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

async function deleteProduct(productId: string) {
  const { error: variantError } = await supabase.from('product_variants').delete().eq('product_id', productId);

  if (variantError) {
    throw variantError;
  }

  const { error } = await supabase.from('products').delete().eq('id', productId);

  if (error) {
    throw error;
  }
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        return mockProducts;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id,name,price,purchase_price,description,image_url,categories(name)')
        .order('name');

      if (error) {
        throw error;
      }

      const { data: variantRows, error: variantError } = await supabase
        .from('product_variants')
        .select('id,product_id,sku,color,size');

      if (variantError) {
        throw variantError;
      }

      const { data: stockRows, error: stockError } = await supabase
        .from('v_current_stock')
        .select('variant_id,product_id,current_stock');

      if (stockError) {
        throw stockError;
      }

      const stockByVariant = new Map<string, number>();
      const stockByProduct = new Map<string, number>();

      for (const row of (stockRows ?? []) as StockRow[]) {
        const currentStock = Number(row.current_stock ?? 0);
        stockByVariant.set(row.variant_id, currentStock);
        stockByProduct.set(row.product_id, (stockByProduct.get(row.product_id) ?? 0) + currentStock);
      }

      const variantsByProduct = new Map<string, ProductVariant[]>();

      for (const variant of (variantRows ?? []) as unknown as VariantRow[]) {
        const mappedVariant: ProductVariant = {
          id: variant.id,
          productId: variant.product_id,
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          priceOverride: null,
          stock: stockByVariant.get(variant.id) ?? 0,
        };
        variantsByProduct.set(variant.product_id, [...(variantsByProduct.get(variant.product_id) ?? []), mappedVariant]);
      }

      return ((data ?? []) as unknown as ProductRow[]).map((item) => {
        const stock = stockByProduct.get(item.id) ?? 0;
        return {
          id: item.id,
          name: item.name,
          category: categoryName(item.categories),
          price: Number(item.price),
          purchasePrice: Number(item.purchase_price),
          description: item.description ?? '',
          imageUrl: item.image_url ?? FALLBACK_IMAGE,
          stock,
          status: stock === 0 ? 'out' : stock <= 5 ? 'low' : 'available',
          variants: variantsByProduct.get(item.id) ?? [],
        };
      });
    },
  });
}

export function useSaveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
    },
  });
}

export function useUploadProductImage() {
  return useMutation({
    mutationFn: uploadProductImage,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
    },
  });
}
