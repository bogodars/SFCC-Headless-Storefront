import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Tag, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/catalog";
import { PROMO_CODES } from "@/lib/cart";

export function CartDrawer() {
  const { items, isOpen, setOpen, totals, promoCode, updateQuantity, removeItem, applyPromo, clearPromo } = useCart();
  const [code, setCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);

  const submitPromo = (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    if (applyPromo(code)) {
      setCode("");
      setPromoError(null);
    } else {
      setPromoError("That code isn't valid.");
    }
  };

  const rate = promoCode ? Math.round((PROMO_CODES[promoCode] ?? 0) * 100) : 0;

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 border-l border-foreground p-0 sm:max-w-md">
        <div className="flex items-center justify-between border-b border-border px-6 py-5 pr-14">
          <SheetTitle className="display text-2xl">Your cart</SheetTitle>
          <span className="eyebrow text-muted-foreground">
            {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
          </span>
        </div>
        <SheetDescription className="sr-only">Review the items in your cart and proceed to checkout.</SheetDescription>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <Button variant="outline" onClick={() => setOpen(false)} asChild>
              <Link to="/">Continue shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.lineId} className="flex gap-4 py-5">
                  <Link
                    to="/product/$id"
                    params={{ id: item.productId }}
                    onClick={() => setOpen(false)}
                    className="block h-28 w-20 shrink-0 overflow-hidden bg-image-bg"
                  >
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium capitalize leading-snug">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.lineId)}
                        aria-label={`Remove ${item.name}`}
                        className="cursor-pointer p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="eyebrow mt-1 text-muted-foreground">
                      {item.size ? `Size ${item.size}` : "One size"}
                      {item.productCode ? ` · ${item.productCode}` : ""}
                    </p>
                    <div className="mt-auto flex items-end justify-between pt-3">
                      <div className="flex h-9 items-center border border-border">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="flex h-full w-9 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono text-sm tabular-nums" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          aria-label="Increase quantity"
                          className="flex h-full w-9 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-sm tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                        {item.quantity >= item.maxStock && (
                          <p className="eyebrow mt-0.5 text-signal">Max {item.maxStock} available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-foreground px-6 py-5">
              {promoCode ? (
                <div className="flex items-center justify-between bg-secondary px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm">
                    <Tag className="h-3.5 w-3.5" />
                    <span className="font-mono font-semibold">{promoCode}</span>
                    <span className="text-muted-foreground">· {rate}% off</span>
                  </span>
                  <button type="button" onClick={clearPromo} className="eyebrow cursor-pointer underline underline-offset-4">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={submitPromo}>
                  <div className="flex">
                    <input
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        setPromoError(null);
                      }}
                      placeholder="Promo code"
                      aria-label="Promo code"
                      aria-invalid={!!promoError}
                      className="h-11 min-w-0 flex-1 border border-r-0 border-input bg-card px-3 font-mono text-sm uppercase outline-none placeholder:normal-case placeholder:font-sans focus:border-foreground"
                    />
                    <Button type="submit" variant="outline" className="h-11">
                      Apply
                    </Button>
                  </div>
                  {promoError && <p className="mt-1.5 text-xs text-destructive">{promoError}</p>}
                </form>
              )}

              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(totals.subtotal)}</dd>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-signal">
                    <dt>Discount ({rate}%)</dt>
                    <dd className="tabular-nums">−{formatPrice(totals.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="text-muted-foreground">Calculated at checkout</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatPrice(totals.total)}</dd>
                </div>
              </dl>

              <Button
                size="lg"
                className="mt-5 w-full"
                onClick={() => toast("Checkout is coming next", { description: "Order submission to Salesforce will be connected in the next step." })}
              >
                Proceed to checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
