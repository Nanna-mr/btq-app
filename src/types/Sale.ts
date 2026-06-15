import type { Product } from './Product';

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface Sale {
  id: string;
  sellerId: string;
  items: CartItem[];
  paymentMethod: 'cash' | 'bankily' | 'sedad' | 'card';
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;
}

export interface CustomOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  productType: string;
  details: string;
  deposit: number;
  totalPrice: number;
  dueDate: string;
  status: 'new' | 'in_progress' | 'ready' | 'delivered' | 'paid' | 'cancelled';
  createdBy?: string | null;
  createdAt?: string;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
}
