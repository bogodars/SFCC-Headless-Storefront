/**
 * Catalog domain: the Salesforce Product2 record shape, the storefront Product model,
 * and the pure filtering / sorting helpers used by the listing page.
 */

export const CATEGORIES = ["Footwear", "Apparel", "Accessories"] as const;

export type SortKey = "featured" | "price-asc" | "price-desc" | "name-asc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
];

export interface Product {
  id: string;
  name: string;
  productCode: string | null;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  sizes: string[];
  stock: number;
  price: number | null;
}

/** Raw Product2 record as returned by the SOQL query (field names as they exist in the org). */
export interface SalesforceProductRecord {
  Id: string;
  Name: string | null;
  ProductCode: string | null;
  Description: string | null;
  Category_c__c?: string | null;
  Image_URL__c?: string | null;
  Sizes__c?: string | null;
  Stock__c?: number | null;
  PricebookEntries?: { records?: { UnitPrice?: number | null }[] | null } | null;
}

export function parseSizes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const size = part.trim().toUpperCase();
    if (size && !seen.has(size)) {
      seen.add(size);
      out.push(size);
    }
  }
  return out;
}

export function mapProductRecord(record: SalesforceProductRecord): Product {
  const unitPrice = record.PricebookEntries?.records?.[0]?.UnitPrice;
  const stock = Number(record.Stock__c ?? 0);
  return {
    id: record.Id,
    name: record.Name?.trim() || "Untitled product",
    productCode: record.ProductCode?.trim() || null,
    description: record.Description?.trim() || null,
    category: record.Category_c__c?.trim() || null,
    imageUrl: record.Image_URL__c?.trim() || null,
    sizes: parseSizes(record.Sizes__c),
    stock: Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0,
    price: typeof unitPrice === "number" && Number.isFinite(unitPrice) ? unitPrice : null,
  };
}

/** Storefront shows only merchandised products (those with an image). */
export function isStorefrontProduct(product: Product): boolean {
  return product.imageUrl !== null;
}

export function isInStock(product: Product): boolean {
  return product.stock > 0;
}

export function canPurchase(product: Product): boolean {
  return isInStock(product) && product.price !== null;
}

const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export function compareSizes(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  const aNum = a !== "" && Number.isFinite(na);
  const bNum = b !== "" && Number.isFinite(nb);
  if (aNum && bNum) return na - nb;
  const la = LETTER_SIZES.indexOf(a);
  const lb = LETTER_SIZES.indexOf(b);
  const rank = (isNum: boolean, letter: number) => (letter >= 0 ? 0 : isNum ? 1 : 2);
  const ra = rank(aNum, la);
  const rb = rank(bNum, lb);
  if (ra !== rb) return ra - rb;
  if (ra === 0) return la - lb;
  return a.localeCompare(b);
}

export function collectSizes(products: Product[]): string[] {
  const all = new Set<string>();
  for (const p of products) for (const s of p.sizes) all.add(s);
  return [...all].sort(compareSizes);
}

export interface CatalogFilters {
  q: string;
  categories: string[];
  sizes: string[];
  min?: number | undefined;
  max?: number | undefined;
  inStock: boolean;
}

function matchesQuery(p: Product, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    p.name.toLowerCase().includes(needle) || (p.productCode ?? "").toLowerCase().includes(needle)
  );
}

function matchesFilters(p: Product, f: CatalogFilters, skipCategory = false) {
  if (!matchesQuery(p, f.q)) return false;
  if (!skipCategory && f.categories.length > 0 && !(p.category && f.categories.includes(p.category)))
    return false;
  if (f.sizes.length > 0 && !p.sizes.some((s) => f.sizes.includes(s))) return false;
  if (f.min !== undefined && (p.price === null || p.price < f.min)) return false;
  if (f.max !== undefined && (p.price === null || p.price > f.max)) return false;
  if (f.inStock && !isInStock(p)) return false;
  return true;
}

export function filterProducts(products: Product[], filters: CatalogFilters): Product[] {
  return products.filter((p) => matchesFilters(p, filters));
}

/** Counts per category among products that match every other active filter. */
export function categoryCounts(products: Product[], filters: CatalogFilters) {
  const counts: Record<string, number> = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const p of products) {
    if (p.category && p.category in counts && matchesFilters(p, filters, true)) {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
  }
  return counts;
}

export function sortProducts(products: Product[], sort: string): Product[] {
  const list = [...products];
  const priceOf = (p: Product, missing: number) => p.price ?? missing;
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => priceOf(a, Infinity) - priceOf(b, Infinity));
    case "price-desc":
      return list.sort((a, b) => priceOf(b, -Infinity) - priceOf(a, -Infinity));
    case "name-asc":
      return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    default:
      return list;
  }
}

export function priceBounds(products: Product[]): { min: number; max: number } | null {
  const prices = products.map((p) => p.price).filter((p): p is number => p !== null);
  if (prices.length === 0) return null;
  return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatPrice(value: number | null): string {
  return value === null ? "Price unavailable" : money.format(value);
}
