export interface Category {
  id: string;
  name: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  productName?: string;
  color: string;
  size: string;
  sku: string;
  stock: number;
  priceOverride?: number | null;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  purchasePrice: number;
  description: string;
  imageUrl: string;
  stock: number;
  status: 'available' | 'low' | 'out';
  variants?: ProductVariant[];
}

export interface ProductFormPayload {
  id?: string;
  name: string;
  category: string;
  price: number;
  purchasePrice: number;
  description: string;
  imageUrl: string;
  variants: Array<{
    id?: string;
    color: string;
    size: string;
    sku: string;
    stock: number;
    priceOverride?: number | null;
  }>;
}

export interface StockMovement {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  note: string;
  createdAt: string;
  saleId?: string | null;
}
