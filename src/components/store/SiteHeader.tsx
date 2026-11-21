import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useCart } from "@/hooks/use-cart";

export function SiteHeader() {
  const { totals, setOpen } = useCart();
  const search = useSearch({ strict: false });
  const urlQuery = typeof search.q === "string" ? search.q : "";
  const [query, setQuery] = useState(urlQuery);
  const navigate = useNavigate();

  useEffect(() => setQuery(urlQuery), [urlQuery]);

  const updateQuery = (value: string) => {
    setQuery(value);
    void navigate({ to: "/", search: (prev) => ({ ...prev, q: value }), replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="bg-foreground py-2 text-center text-background">
        <p className="eyebrow">
          Take 20% off your order with code <span className="font-semibold">SFCC20</span>
        </p>
      </div>
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 md:gap-8 md:px-8">
        <Link to="/" className="display shrink-0 text-lg md:text-2xl" aria-label="SFCC Headless Store — home">
          SFCC <span className="font-normal">Headless Store</span>
        </Link>

        <div className="relative ml-auto flex h-10 w-full max-w-md items-center border-b border-foreground/30 focus-within:border-foreground md:mx-auto">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder="Search by name or SKU"
            aria-label="Search products"
            className="w-full bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => updateQuery("")} aria-label="Clear search" className="cursor-pointer p-1">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex h-10 shrink-0 cursor-pointer items-center gap-2 px-1"
          aria-label={`Open cart, ${totals.itemCount} items`}
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="eyebrow hidden sm:inline">Cart</span>
          <span className="flex h-5 min-w-5 items-center justify-center bg-foreground px-1 font-mono text-[10px] text-background tabular-nums">
            {totals.itemCount}
          </span>
        </button>
      </div>
    </header>
  );
}
