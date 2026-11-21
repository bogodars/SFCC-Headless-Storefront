import { describe, expect, it } from "vitest";

import { isStorefrontProduct, mapProductRecord, parseSizes } from "@/lib/catalog";

describe("catalog rules", () => {
  it("reads comma-separated sizes as trimmed, uppercase, unique values", () => {
    expect(parseSizes(" 41, m ,42, M, ,xl ")).toEqual(["41", "M", "42", "XL"]);
    expect(parseSizes(null)).toEqual([]);
  });

  it("hides products without an image", () => {
    const withoutImage = mapProductRecord({
      Id: "sample-1",
      Name: "GenWatt generator",
      ProductCode: null,
      Description: null,
    });
    const withImage = mapProductRecord({
      Id: "product-1",
      Name: "Nike run 1 red",
      ProductCode: null,
      Description: null,
      Image_URL__c: "https://images.unsplash.com/product-1",
    });

    expect(isStorefrontProduct(withoutImage)).toBe(false);
    expect(isStorefrontProduct(withImage)).toBe(true);
  });
});
