import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CatalogSkeleton } from "@/components/store/CatalogSkeleton";
import { FilterSidebar } from "@/components/store/FilterSidebar";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import {
  SORT_OPTIONS,
  categoryCounts,
  collectSizes,
  filterProducts,
  formatPrice,
  priceBounds,
  sortProducts,
  type CatalogFilters,
} from "@/lib/catalog";
import { productsQueryOptions } from "@/lib/catalog-query";
import { catalogSearchSchema, type CatalogSearch } from "@/lib/catalog-search";

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(catalogSearchSchema),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  head: () => ({
    meta: [
      { title: "Shop All — SFCC Headless Store" },
      {
        name: "description",
        content: "Shop footwear, apparel and accessories with live stock and pricing from Salesforce.",
      },
      { property: "og:title", content: "Shop All — SFCC Headless Store" },
      {
        property: "og:description",
        content: "Shop footwear, apparel and accessories with live stock and pricing from Salesforce.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: CatalogSkeleton,
  pendingMs: 150,
  errorComponent: CatalogError,
  component: ProductListingPage,
});

function CatalogError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start px-4 py-24 md:px-8">
      <p className="eyebrow text-destructive">Catalog unavailable</p>
      <h1 className="display mt-3 text-5xl">Something went wrong</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        {error instanceof Error && error.message
          ? error.message
          : "We couldn't load products from Salesforce."}{" "}
        Please try again in a moment.
      </p>
      <Button
        className="mt-8"
        onClick={() => {
          reset();
          void router.invalidate();
        }}
      >
        Try again
      </Button>
    </div>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);
  return isDesktop;
}

function ProductListingPage() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const isDesktop = useIsDesktop();
  const [filtersOpen, setFiltersOpen] = useState<boolean | null>(null);

  const filters: CatalogFilters = {
    q: search.q,
    categories: search.category,
    sizes: search.size,
    min: search.min,
    max: search.max,
    inStock: search.inStock,
  };

  const results = useMemo(
    () => sortProducts(filterProducts(products, filters), search.sort),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, search],
  );
  const counts = useMemo(
    () => categoryCounts(products, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, search],
  );
  const sizes = useMemo(() => collectSizes(products), [products]);
  const bounds = useMemo(() => priceBounds(products), [products]);

  const update = (patch: Partial<CatalogSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true, resetScroll: false });
  const clearFilters = () =>
    update({ category: [], size: [], min: undefined, max: undefined, inStock: false });

  const chips: { key: string; label: string; remove: () => void }[] = [
    ...search.category.map((c) => ({
      key: `c-${c}`,
      label: c,
      remove: () => update({ category: search.category.filter((v) => v !== c) }),
    })),
    ...search.size.map((s) => ({
      key: `s-${s}`,
      label: `Size ${s}`,
      remove: () => update({ size: search.size.filter((v) => v !== s) }),
    })),
    ...(search.min !== undefined
      ? [{ key: "min", label: `From ${formatPrice(search.min)}`, remove: () => update({ min: undefined }) }]
      : []),
    ...(search.max !== undefined
      ? [{ key: "max", label: `Up to ${formatPrice(search.max)}`, remove: () => update({ max: undefined }) }]
      : []),
    ...(search.inStock ? [{ key: "stock", label: "In stock", remove: () => update({ inStock: false }) }] : []),
  ];

  const sidebarVisible = filtersOpen ?? isDesktop;
  const sidebarClass = filtersOpen === null ? "hidden lg:block" : filtersOpen ? "block" : "hidden";

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 md:px-8">
      <section className="flex flex-col gap-4 border-b border-border py-10 md:flex-row md:items-end md:justify-between md:py-14">
        <div>
          <p className="eyebrow text-muted-foreground">Live from Salesforce · {products.length} products</p>
          <h1 className="display mt-3 text-6xl md:text-8xl">
            {search.q ? <>“{search.q}”</> : "Shop all"}
          </h1>
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">
          Footwear, apparel and accessories. Prices and stock update straight from the catalog.
        </p>
      </section>

      <div className="sticky top-[97px] z-30 -mx-4 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setFiltersOpen(!sidebarVisible)}
            aria-expanded={sidebarVisible}
            className="eyebrow flex cursor-pointer items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {sidebarVisible ? "Hide filters" : "Show filters"}
            {chips.length > 0 && (
              <span className="bg-foreground px-1.5 text-background">{chips.length}</span>
            )}
          </button>
          <span className="eyebrow hidden text-muted-foreground sm:inline" aria-live="polite">
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
        </div>
        <label className="relative flex items-center gap-2">
          <span className="eyebrow hidden text-muted-foreground sm:inline">Sort</span>
          <select
            value={search.sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="eyebrow h-9 cursor-pointer appearance-none border border-border bg-background pl-3 pr-8 text-foreground outline-none hover:border-foreground focus:border-foreground"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5" />
        </label>
      </div>

      <div className="flex flex-col gap-8 pt-6 lg:flex-row lg:gap-10">
        <aside className={`${sidebarClass} w-full shrink-0 lg:w-60`} aria-label="Filters">
          <div className="lg:sticky lg:top-[160px]">
            <FilterSidebar
              search={search}
              counts={counts}
              sizes={sizes}
              bounds={bounds}
              hasActiveFilters={chips.length > 0}
              onChange={update}
              onClear={clearFilters}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.remove}
                  className="eyebrow flex cursor-pointer items-center gap-1.5 border border-foreground px-2.5 py-1.5 hover:bg-foreground hover:text-background"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button type="button" onClick={clearFilters} className="eyebrow cursor-pointer px-2 underline underline-offset-4">
                Clear all
              </button>
            </div>
          )}

          {results.length === 0 ? (
            <div className="flex flex-col items-start border border-dashed border-border px-8 py-16">
              <p className="eyebrow text-muted-foreground">No matches</p>
              <p className="display mt-3 text-4xl">Nothing fits those filters</p>
              <p className="mt-3 text-sm text-muted-foreground">Try removing a filter or searching for something else.</p>
              <div className="mt-6 flex gap-3">
                {chips.length > 0 && <Button onClick={clearFilters}>Clear filters</Button>}
                {search.q && (
                  <Button variant="outline" onClick={() => update({ q: "" })}>
                    Clear search
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 ${sidebarVisible ? "xl:grid-cols-3 2xl:grid-cols-4" : "xl:grid-cols-4"}`}
            >
              {results.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
