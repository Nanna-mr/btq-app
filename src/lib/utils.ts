import type { Discount } from '../types/Sale';

export const TVA_RATE = 0.16;
export const MAX_CART_ITEMS = 50;

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-MR', {
    style: 'currency',
    currency: 'MRU',
    maximumFractionDigits: 0,
  }).format(value);
}

export function calculateTVA(amount: number) {
  return Math.round(amount * TVA_RATE);
}

export function validateDiscount(discount: Discount, subtotal: number) {
  if (discount.value < 0) {
    return false;
  }

  if (discount.type === 'percentage') {
    return discount.value <= 100;
  }

  return discount.value <= subtotal;
}

export function applyDiscount(subtotal: number, discount: Discount) {
  if (!validateDiscount(discount, subtotal)) {
    return subtotal;
  }

  if (discount.type === 'percentage') {
    return Math.round(subtotal - subtotal * (discount.value / 100));
  }

  return subtotal - discount.value;
}
