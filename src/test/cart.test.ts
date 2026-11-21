import { describe, expect, it } from "vitest";

import { addItem, cartTotals, normalizePromo, updateQuantity, type NewCartItem } from "@/lib/cart";

const item: NewCartItem = {
  productId: "product-1",
  name: "Nike run 1 red",
  productCode: "NIKE-RUN-1",
  imageUrl: "https://images.unsplash.com/product-1",
  price: 50,
  size: "42",
  maxStock: 3,
};

describe("cart rules", () => {
  it("applies SFCC20 as a 20% discount", () => {
    const items = addItem([], item, 2);

    expect(normalizePromo(" sfcc20 ")).toBe("SFCC20");
    expect(cartTotals(items, "SFCC20")).toEqual({
      itemCount: 2,
      subtotal: 100,
      discount: 20,
      total: 80,
    });
  });

  it("never increases a line quantity beyond available stock", () => {
    const items = addItem([], item, 2);
    const [line] = items;
    expect(line).toBeDefined();
    if (!line) return;

    const addedBeyondStock = addItem(items, item, 5);
    expect(addedBeyondStock[0]?.quantity).toBe(3);

    const updatedBeyondStock = updateQuantity(items, line.lineId, 99);
    expect(updatedBeyondStock[0]?.quantity).toBe(3);
  });
});
