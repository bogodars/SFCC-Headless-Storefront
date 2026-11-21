export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skeleton-shimmer aspect-[3/4]" />
          <div className="mt-3 flex justify-between gap-4">
            <div className="skeleton-shimmer h-4 w-2/3" />
            <div className="skeleton-shimmer h-4 w-12" />
          </div>
          <div className="skeleton-shimmer mt-2 h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 md:px-8">
      <div className="border-b border-border py-10">
        <div className="skeleton-shimmer h-3 w-24" />
        <div className="skeleton-shimmer mt-4 h-14 w-72" />
      </div>
      <div className="flex gap-10 pt-8">
        <div className="hidden w-60 shrink-0 space-y-6 lg:block">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-3 border-b border-border pb-6">
              <div className="skeleton-shimmer h-3 w-20" />
              <div className="skeleton-shimmer h-4 w-full" />
              <div className="skeleton-shimmer h-4 w-3/4" />
            </div>
          ))}
        </div>
        <div className="flex-1">
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
