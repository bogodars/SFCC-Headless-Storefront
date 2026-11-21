import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES, formatPrice } from "@/lib/catalog";
import type { CatalogSearch } from "@/lib/catalog-search";

import { SizePill } from "./SizePill";

interface FilterSidebarProps {
  search: CatalogSearch;
  counts: Record<string, number>;
  sizes: string[];
  bounds: { min: number; max: number } | null;
  hasActiveFilters: boolean;
  onChange: (patch: Partial<CatalogSearch>) => void;
  onClear: () => void;
}

function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-border py-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between"
      >
        <span className="eyebrow text-foreground">{title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pt-4 animate-in fade-in duration-200">{children}</div>}
    </section>
  );
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function PriceInput({
  label,
  value,
  placeholder,
  onCommit,
}: {
  label: string;
  value: number | undefined;
  placeholder: string;
  onCommit: (v: number | undefined) => void;
}) {
  const [draft, setDraft] = useState(value?.toString() ?? "");
  useEffect(() => setDraft(value?.toString() ?? ""), [value]);
  const commit = () => {
    const n = Number(draft);
    const next = draft.trim() === "" || !Number.isFinite(n) || n < 0 ? undefined : n;
    if (next !== value) onCommit(next);
    if (next === undefined) setDraft("");
  };
  return (
    <label className="flex-1">
      <span className="eyebrow text-muted-foreground">{label}</span>
      <div className="mt-1.5 flex h-10 items-center border border-input bg-card px-2 focus-within:border-foreground">
        <span className="text-sm text-muted-foreground">$</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className="w-full min-w-0 bg-transparent px-1 text-sm tabular-nums outline-none placeholder:text-muted-foreground/60"
        />
      </div>
    </label>
  );
}

export function FilterSidebar({ search, counts, sizes, bounds, hasActiveFilters, onChange, onClear }: FilterSidebarProps) {
  return (
    <div>
      <Section title="Category">
        <ul className="space-y-3">
          {CATEGORIES.map((cat) => {
            const id = `cat-${cat}`;
            const count = counts[cat] ?? 0;
            return (
              <li key={cat} className="flex items-center gap-3">
                <Checkbox
                  id={id}
                  checked={search.category.includes(cat)}
                  onCheckedChange={() => onChange({ category: toggle(search.category, cat) })}
                />
                <label htmlFor={id} className="flex flex-1 cursor-pointer items-center justify-between text-sm">
                  {cat}
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </Section>

      {sizes.length > 0 && (
        <Section title="Size">
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <SizePill key={s} selected={search.size.includes(s)} onClick={() => onChange({ size: toggle(search.size, s) })}>
                {s}
              </SizePill>
            ))}
          </div>
        </Section>
      )}

      <Section title="Price">
        <div className="flex gap-2">
          <PriceInput label="Min" value={search.min} placeholder={bounds ? String(bounds.min) : "0"} onCommit={(min) => onChange({ min })} />
          <PriceInput label="Max" value={search.max} placeholder={bounds ? String(bounds.max) : "—"} onCommit={(max) => onChange({ max })} />
        </div>
        {bounds && (
          <p className="mt-2 text-xs text-muted-foreground">
            Range {formatPrice(bounds.min)} – {formatPrice(bounds.max)}
          </p>
        )}
      </Section>

      <section className="flex items-center justify-between border-b border-border py-5">
        <label htmlFor="in-stock" className="eyebrow cursor-pointer text-foreground">
          In stock only
        </label>
        <Switch id="in-stock" checked={search.inStock} onCheckedChange={(inStock) => onChange({ inStock })} />
      </section>

      <button
        type="button"
        onClick={onClear}
        disabled={!hasActiveFilters}
        className="eyebrow mt-5 cursor-pointer text-foreground underline underline-offset-4 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
      >
        Clear all filters
      </button>
    </div>
  );
}
