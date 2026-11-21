import { Link } from "@tanstack/react-router";

import { formatPrice, isInStock, type Product } from "@/lib/catalog";

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const inStock = isInStock(product);
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-image-bg">
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04] ${inStock ? "" : "opacity-60 grayscale"}`}
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.category && (
            <span className="eyebrow bg-background px-2 py-1 text-foreground">{product.category}</span>
          )}
          {!inStock && (
            <span className="eyebrow bg-foreground px-2 py-1 text-background">Out of stock</span>
          )}
        </div>
        {inStock && product.stock <= 3 && (
          <span className="eyebrow absolute bottom-3 left-3 bg-signal px-2 py-1 text-signal-foreground">
            Only {product.stock} left
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-4 pt-3">
        <h3 className="text-sm font-medium capitalize leading-snug underline-offset-4 group-hover:underline">
          {product.name}
        </h3>
        <p className="shrink-0 text-sm tabular-nums">{formatPrice(product.price)}</p>
      </div>
      {product.sizes.length > 0 && (
        <p className="eyebrow mt-1 text-muted-foreground">
          {product.sizes.length === 1 ? product.sizes[0] : `${product.sizes.length} sizes`}
        </p>
      )}
    </Link>
  );
}
