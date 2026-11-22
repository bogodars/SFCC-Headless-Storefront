import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, CheckCircle2, LoaderCircle, ShoppingBag } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/catalog";
import { checkoutCustomerSchema, type CheckoutCustomer } from "@/lib/checkout";
import { submitOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — SFCC Headless Store" },
      {
        name: "description",
        content: "Review your order and send your shipping details securely to Salesforce.",
      },
      { property: "og:title", content: "Checkout — SFCC Headless Store" },
      {
        property: "og:description",
        content: "Review your order and send your shipping details securely to Salesforce.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

type Confirmation = Awaited<ReturnType<typeof submitOrder>>;
type FieldErrors = Partial<Record<keyof CheckoutCustomer, string>>;

const emptyForm: CheckoutCustomer = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  notes: "",
};

const inputClass =
  "h-12 rounded-none border-input bg-card px-3.5 focus-visible:ring-0 focus-visible:border-foreground";

function CheckoutPage() {
  const { items, promoCode, totals, clearCart, setOpen } = useCart();
  const submitOrderFn = useServerFn(submitOrder);
  const [values, setValues] = useState<CheckoutCustomer>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const updateField = (field: keyof CheckoutCustomer, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmitError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const parsed = checkoutCustomerSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof CheckoutCustomer | undefined;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitOrderFn({
        data: {
          customer: parsed.data,
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
          })),
          promoCode,
        },
      });
      setConfirmation(result);
      clearCart();
      setOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't submit your order. Your cart is still saved; please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) return <OrderConfirmation confirmation={confirmation} />;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center md:px-8">
        <ShoppingBag className="h-10 w-10 text-muted-foreground" strokeWidth={1.25} />
        <p className="eyebrow mt-6 text-muted-foreground">Checkout</p>
        <h1 className="display mt-3 text-5xl">Your cart is empty</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Add a product and select a size before checking out.
        </p>
        <Button asChild className="mt-8">
          <Link to="/">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 md:px-8">
      <nav className="py-5" aria-label="Breadcrumb">
        <Link to="/" className="eyebrow inline-flex items-center gap-1.5 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Continue shopping
        </Link>
      </nav>

      <header className="border-y border-border py-8 md:py-10">
        <p className="eyebrow text-muted-foreground">Secure checkout · Salesforce order capture</p>
        <h1 className="display mt-3 text-6xl md:text-8xl">Checkout</h1>
      </header>

      <div className="grid gap-12 pt-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
        <form onSubmit={handleSubmit} noValidate className="min-w-0">
          <section aria-labelledby="customer-heading">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-muted-foreground">01</span>
              <h2 id="customer-heading" className="display text-3xl">
                Your details
              </h2>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <FormField label="Full name" name="fullName" error={errors.fullName}>
                <Input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  required
                  value={values.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                  className={inputClass}
                  placeholder="Your full name"
                />
              </FormField>
              <FormField label="Email" name="email" error={errors.email}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </FormField>
              <FormField label="Phone" name="phone" error={errors.phone}>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={values.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  className={inputClass}
                  placeholder="+1 555 000 0000"
                />
              </FormField>
              <FormField label="City" name="city" error={errors.city}>
                <Input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  required
                  value={values.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={errors.city ? "city-error" : undefined}
                  className={inputClass}
                  placeholder="Your city"
                />
              </FormField>
            </div>
          </section>

          <section aria-labelledby="shipping-heading" className="mt-12">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-muted-foreground">02</span>
              <h2 id="shipping-heading" className="display text-3xl">
                Shipping
              </h2>
            </div>
            <div className="mt-6 grid gap-5">
              <FormField label="Shipping address" name="address" error={errors.address}>
                <Input
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  required
                  value={values.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  aria-invalid={Boolean(errors.address)}
                  aria-describedby={errors.address ? "address-error" : undefined}
                  className={inputClass}
                  placeholder="Street and house number"
                />
              </FormField>
              <FormField label="Order notes (optional)" name="notes" error={errors.notes}>
                <Textarea
                  id="notes"
                  name="notes"
                  value={values.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  aria-invalid={Boolean(errors.notes)}
                  aria-describedby={errors.notes ? "notes-error" : undefined}
                  className="min-h-28 resize-y rounded-none border-input bg-card px-3.5 py-3 focus-visible:ring-0 focus-visible:border-foreground"
                  placeholder="Delivery instructions or anything else we should know"
                />
              </FormField>
            </div>
          </section>

          {submitError && (
            <div
              role="alert"
              className="mt-6 border border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {submitError} Your cart has not been cleared.
            </div>
          )}

          <Button type="submit" size="lg" className="mt-8 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <LoaderCircle className="animate-spin" /> Sending order to Salesforce…
              </>
            ) : (
              <>Place order · {formatPrice(totals.total)}</>
            )}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Your order is created as a Salesforce Lead with a unique order number.
          </p>
        </form>

        <aside className="min-w-0 lg:sticky lg:top-32 lg:self-start" aria-label="Order summary">
          <div className="border border-foreground">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="display text-2xl">Order summary</h2>
              <span className="eyebrow text-muted-foreground">{totals.itemCount} items</span>
            </div>
            <ul className="divide-y divide-border px-5">
              {items.map((item) => (
                <li key={item.lineId} className="flex gap-4 py-5">
                  <div className="h-24 w-18 shrink-0 overflow-hidden bg-image-bg">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize leading-snug">{item.name}</p>
                    <p className="eyebrow mt-1 text-muted-foreground">
                      {item.size ? `Size ${item.size}` : "One size"} · Qty {item.quantity}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatPrice(item.price)} each
                    </p>
                    <p className="mt-2 text-sm tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-border px-5 py-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(totals.subtotal)}</dd>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-signal">
                  <dt>SFCC20 · 20% off</dt>
                  <dd className="tabular-nums">−{formatPrice(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="text-muted-foreground">Calculated later</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(totals.total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: keyof CheckoutCustomer;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="eyebrow mb-2 block">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function OrderConfirmation({ confirmation }: { confirmation: Confirmation }) {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 md:px-8">
      <section className="flex flex-col items-center border-b border-border py-14 text-center md:py-20">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-foreground">
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
        </span>
        <p className="eyebrow mt-7 text-muted-foreground">Order confirmed</p>
        <h1 className="display mt-3 text-6xl md:text-8xl">Thank you</h1>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
          Thanks, {confirmation.customer.fullName}. Your order has been received and created in
          Salesforce.
        </p>
        <div className="mt-7 border border-foreground bg-secondary px-6 py-4">
          <p className="eyebrow text-muted-foreground">Order number</p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-wider">
            {confirmation.orderNumber}
          </p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="purchased-heading">
        <div className="flex items-center justify-between">
          <h2 id="purchased-heading" className="display text-3xl">
            Your order
          </h2>
          <span className="eyebrow text-muted-foreground">
            {confirmation.totals.itemCount} items
          </span>
        </div>
        <ul className="mt-5 divide-y divide-border border-y border-border">
          {confirmation.items.map((item) => (
            <li key={item.lineId} className="flex items-center gap-4 py-4">
              <div className="h-20 w-16 shrink-0 overflow-hidden bg-image-bg">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium capitalize">{item.name}</p>
                <p className="eyebrow mt-1 text-muted-foreground">
                  {item.size ? `Size ${item.size}` : "One size"} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm tabular-nums">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="ml-auto mt-5 max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatPrice(confirmation.totals.subtotal)}</dd>
          </div>
          {confirmation.totals.discount > 0 && (
            <div className="flex justify-between text-signal">
              <dt>{confirmation.promoCode} discount</dt>
              <dd>−{formatPrice(confirmation.totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(confirmation.totals.total)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-12 flex justify-center">
        <Button asChild size="lg">
          <Link to="/">
            <Check /> Continue shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
