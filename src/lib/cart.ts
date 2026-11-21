/** Pure cart logic: line items, stock-capped quantities, promo codes and totals. */

export interface CartItem {
  lineId: string;
  productId: string;
  name: string;
  productCode: string | null;
  imageUrl: string | null;
  price: number;
  size: string | null;
  quantity: number;
  maxStock: number;
}

export type NewCartItem = Omit<CartItem, "lineId" | "quantity">;

export const PROMO_CODES: Record<string, number> = { SFCC20: 0.2 };

export function lineIdFor(productId: string, size: string | null) {
  return `${productId}::${size ?? ""}`;
}

function clamp(quantity: number, maxStock: number) {
  return Math.max(1, Math.min(Math.floor(quantity), Math.max(1, maxStock)));
}

export function addItem(items: CartItem[], item: NewCartItem, quantity = 1): CartItem[] {
  if (item.maxStock <= 0) return items;
  const lineId = lineIdFor(item.productId, item.size);
  const existing = items.find((i) => i.lineId === lineId);
  if (existing) {
    return items.map((i) =>
      i.lineId === lineId
        ? { ...i, ...item, lineId, quantity: clamp(i.quantity + quantity, item.maxStock) }
        : i,
    );
  }
  return [...items, { ...item, lineId, quantity: clamp(quantity, item.maxStock) }];
}

export function updateQuantity(items: CartItem[], lineId: string, quantity: number): CartItem[] {
  return items.map((i) => (i.lineId === lineId ? { ...i, quantity: clamp(quantity, i.maxStock) } : i));
}

export function removeItem(items: CartItem[], lineId: string): CartItem[] {
  return items.filter((i) => i.lineId !== lineId);
}

/** Returns the normalized promo code when valid, otherwise null. */
export function normalizePromo(code: string): string | null {
  const normalized = code.trim().toUpperCase();
  return normalized in PROMO_CODES ? normalized : null;
}

export function cartTotals(items: CartItem[], promoCode: string | null) {
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = round(items.reduce((n, i) => n + i.price * i.quantity, 0));
  const rate = promoCode ? (PROMO_CODES[promoCode] ?? 0) : 0;
  const discount = round(subtotal * rate);
  return { itemCount, subtotal, discount, total: round(subtotal - discount) };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
