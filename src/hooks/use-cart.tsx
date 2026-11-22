import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  addItem as addCartItem,
  cartTotals,
  normalizePromo,
  removeItem as removeCartItem,
  updateQuantity as updateCartQuantity,
  type CartItem,
  type NewCartItem,
} from "@/lib/cart";

const STORAGE_KEY = "sfcc-headless-cart-v1";

interface StoredCart {
  items: CartItem[];
  promoCode: string | null;
}

interface CartContextValue {
  items: CartItem[];
  promoCode: string | null;
  totals: ReturnType<typeof cartTotals>;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: NewCartItem, quantity?: number) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;
  clearCart: () => void;
  quantityInCart: (lineId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<StoredCart>({ items: [], promoCode: null });
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredCart>;
        setCart({
          items: Array.isArray(parsed.items) ? parsed.items : [],
          promoCode: typeof parsed.promoCode === "string" ? normalizePromo(parsed.promoCode) : null,
        });
      }
    } catch {
      // Corrupt storage: start with an empty cart.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (cart.items.length === 0 && cart.promoCode === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart, loaded]);

  const addItem = useCallback((item: NewCartItem, quantity = 1) => {
    setCart((c) => ({ ...c, items: addCartItem(c.items, item, quantity) }));
  }, []);
  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setCart((c) => ({ ...c, items: updateCartQuantity(c.items, lineId, quantity) }));
  }, []);
  const removeItem = useCallback((lineId: string) => {
    setCart((c) => ({ ...c, items: removeCartItem(c.items, lineId) }));
  }, []);
  const applyPromo = useCallback((code: string) => {
    const valid = normalizePromo(code);
    if (valid) setCart((c) => ({ ...c, promoCode: valid }));
    return valid !== null;
  }, []);
  const clearPromo = useCallback(() => setCart((c) => ({ ...c, promoCode: null })), []);
  const clearCart = useCallback(() => setCart({ items: [], promoCode: null }), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items: cart.items,
      promoCode: cart.promoCode,
      totals: cartTotals(cart.items, cart.promoCode),
      isOpen,
      setOpen,
      addItem,
      updateQuantity,
      removeItem,
      applyPromo,
      clearPromo,
      clearCart,
      quantityInCart: (lineId) => cart.items.find((i) => i.lineId === lineId)?.quantity ?? 0,
    }),
    [cart, isOpen, addItem, updateQuantity, removeItem, applyPromo, clearPromo, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
