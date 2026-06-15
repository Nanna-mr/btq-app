import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductVariant } from '../types/Product';
import { applyDiscount, calculateTVA } from '../lib/utils';

export interface CartLine {
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  imageUrl: string;
  unitPrice: number;
  stock: number;
  quantity: number;
}

interface CartState {
  items: CartLine[];
  discount: number;
  addItem: (product: Product, variant: ProductVariant) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  applyDiscount: (discount: number) => void;
  subtotal: () => number;
  tax: () => number;
  total: () => number;
}

function linePrice(product: Product, variant: ProductVariant) {
  return variant.priceOverride ?? product.price;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,
      addItem: (product, variant) => {
        if (variant.stock <= 0) {
          return;
        }

        set((state) => {
          const current = state.items.find((item) => item.variantId === variant.id);

          if (current) {
            return {
              items: state.items.map((item) =>
                item.variantId === variant.id
                  ? { ...item, quantity: Math.min(item.stock, item.quantity + 1) }
                  : item,
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                variantId: variant.id,
                name: product.name,
                sku: variant.sku,
                imageUrl: product.imageUrl,
                unitPrice: linePrice(product, variant),
                stock: variant.stock,
                quantity: 1,
              },
            ],
          };
        });
      },
      updateQuantity: (variantId, quantity) => {
        set((state) => ({
          items: state.items
            .map((item) => (item.variantId === variantId ? { ...item, quantity: Math.max(0, Math.min(item.stock, quantity)) } : item))
            .filter((item) => item.quantity > 0),
        }));
      },
      removeItem: (variantId) => {
        set((state) => ({ items: state.items.filter((item) => item.variantId !== variantId) }));
      },
      clearCart: () => set({ items: [], discount: 0 }),
      applyDiscount: (discount) => set({ discount: Math.max(0, discount) }),
      subtotal: () => get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      tax: () => calculateTVA(applyDiscount(get().subtotal(), { type: 'fixed', value: get().discount })),
      total: () => {
        const discounted = applyDiscount(get().subtotal(), { type: 'fixed', value: get().discount });
        return discounted + calculateTVA(discounted);
      },
    }),
    {
      name: 'btq-cart',
      partialize: (state) => ({
        items: state.items,
        discount: state.discount,
      }),
    },
  ),
);
