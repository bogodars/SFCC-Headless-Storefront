import { fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

export const catalogSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  category: fallback(z.array(z.string()), []).default([]),
  size: fallback(z.array(z.string()), []).default([]),
  min: fallback(z.number().optional(), undefined),
  max: fallback(z.number().optional(), undefined),
  inStock: fallback(z.boolean(), false).default(false),
  sort: fallback(z.string(), "featured").default("featured"),
});

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;

export const catalogSearchDefaults = {
  q: "",
  category: [] as string[],
  size: [] as string[],
  inStock: false,
  sort: "featured",
};
