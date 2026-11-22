import { createServerFn } from "@tanstack/react-start";

import type { Product } from "./catalog";
import { fetchStorefrontProducts } from "./catalog.server";

export const getProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Product[]> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const salesforceKey = process.env["SALESFORCE_API_KEY"];
    if (!lovableKey || !salesforceKey) {
      throw new Error("The store isn't connected to Salesforce right now.");
    }

    return fetchStorefrontProducts(lovableKey, salesforceKey);
  },
);
