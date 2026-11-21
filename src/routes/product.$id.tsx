import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SizePill } from "@/components/store/SizePill";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { canPurchase, formatPrice, isInStock } from "@/lib/catalog";
import { productsQueryOptions } from "@/lib/catalog-query";
import { lineIdFor } from "@/lib/cart";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ context, params }) => {
    const products = await context.queryClient.ensureQueryData(productsQueryOptions);
    const product = products.find((p) => p.id === params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) {
      return { meta: [{ title: "Product unavailable — SFCC Headless Store" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${product.name} — SFCC Headless Store`;
    const description =
      product.description ??
      `${product.name}${product.category ? ` · ${product.category}` : ""} at ${formatPrice(product.price)}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(product.imageUrl
          ? [
              { property: "og:image", content: product.imageUrl },
              { name: "twitter:image", content: product.imageUrl },
            ]
          : []),
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductDetailPage,
});

function ProductNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 md:px-8">
      <p className="eyebrow text-muted-foreground">Not found</p>
      <h1 className="display mt-3 text-5xl">This product isn't available</h1>
      <Button asChild className="mt-8">
        <Link to="/">Back to shop</Link>
      </Button>
    </div>
  );
}

function ProductDetailPage() {
  const { product } = Route.useLoaderData();
  const { addItem, setOpen, quantityInCart } = useCart();
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? (product.sizes[0] ?? null) : null);
  const [showSizeHint, setShowSizeHint] = useState(false);

  const inStock = isInStock(product);
  const purchasable = canPurchase(product);
  const needsSize = product.sizes.length > 0 && size === null;
  const inCart = quantityInCart(lineIdFor(product.id, size));
  const atMax = inCart >= product.stock;

  const handleAdd = () => {
    if (needsSize) {
      setShowSizeHint(true);
      return;
    }
    if (!purchasable || atMax || product.price === null) return;
    addItem({
      productId: product.id,
      name: product.name,
      productCode: product.productCode,
      imageUrl: product.imageUrl,
      price: product.price,
      size,
      maxStock: product.stock,
    });
    toast.success("Added to cart", { description: `${product.name}${size ? ` · Size ${size}` : ""}` });
    setOpen(true);
  };

  let label = "Add to cart";
  if (!inStock) label = "Out of stock";
  else if (product.price === null) label = "Unavailable";
  else if (needsSize) label = "Select a size";
  else if (atMax) label = "Max quantity in cart";

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 md:px-8">
      <nav className="flex items-center gap-2 py-5" aria-label="Breadcrumb">
        <Link to="/" className="eyebrow flex items-center gap-1.5 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Shop all
        </Link>
        {product.category && (
          <>
            <span className="eyebrow text-muted-foreground">/</span>
            <Link to="/" search={{ category: [product.category] }} className="eyebrow text-muted-foreground hover:text-foreground hover:underline">
              {product.category}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 border-t border-border pt-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden bg-image-bg animate-in fade-in duration-700">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`h-full w-full object-cover ${inStock ? "" : "opacity-60 grayscale"}`}
            />
          )}
          {!inStock && (
            <span className="eyebrow absolute left-4 top-4 bg-foreground px-2.5 py-1.5 text-background">Out of stock</span>
          )}
        </div>

        <div className="lg:sticky lg:top-[120px] lg:self-start">
          {product.category && <p className="eyebrow text-muted-foreground">{product.category}</p>}
          <h1 className="display mt-3 text-5xl capitalize md:text-6xl">{product.name}</h1>
          <p className="mt-5 text-2xl tabular-nums">{formatPrice(product.price)}</p>

          <dl className="mt-6 grid grid-cols-2 border-y border-border">
            <div className="border-r border-border py-4 pr-4">
              <dt className="eyebrow text-muted-foreground">SKU</dt>
              <dd className="mt-1 font-mono text-sm">{product.productCode ?? "—"}</dd>
            </div>
            <div className="py-4 pl-4">
              <dt className="eyebrow text-muted-foreground">Availability</dt>
              <dd className={`mt-1 flex items-center gap-2 text-sm ${inStock ? "" : "text-destructive"}`}>
                <span className={`h-2 w-2 ${inStock ? (product.stock <= 3 ? "bg-signal" : "bg-foreground") : "bg-destructive"}`} />
                {inStock ? `${product.stock} ${product.stock === 1 ? "unit" : "units"} left` : "Out of stock"}
              </dd>
            </div>
          </dl>

          {product.sizes.length > 0 && (
            <fieldset className="mt-8">
              <div className="flex items-center justify-between">
                <legend className="eyebrow">
                  Size{size ? <span className="text-muted-foreground"> · {size}</span> : null}
                </legend>
                {showSizeHint && needsSize && (
                  <span className="eyebrow text-destructive" role="alert">
                    Please select a size
                  </span>
                )}
              </div>
              <div className={`mt-3 flex flex-wrap gap-2`}>
                {product.sizes.map((s) => (
                  <SizePill
                    key={s}
                    size="lg"
                    selected={size === s}
                    disabled={!inStock}
                    onClick={() => {
                      setSize(s);
                      setShowSizeHint(false);
                    }}
                  >
                    {s}
                  </SizePill>
                ))}
              </div>
            </fieldset>
          )}

          <Button
            size="lg"
            className="mt-8 w-full"
            onClick={handleAdd}
            disabled={!purchasable || (!needsSize && atMax)}
            aria-disabled={needsSize}
          >
            {label}
          </Button>
          {inCart > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5" /> {inCart} in your cart
            </p>
          )}

          {product.description && (
            <div className="mt-10 border-t border-border pt-6">
              <h2 className="eyebrow">Description</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground first-letter:uppercase">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
