import { describe, expect, it } from "vitest";

import type { Product } from "@/lib/catalog";
import { cartTotals } from "@/lib/cart";
import {
  buildOrderDescription,
  checkoutCustomerSchema,
  resolveOrderItems,
  type CheckoutCustomer,
} from "@/lib/checkout";

const validCustomer: CheckoutCustomer = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+1 555 010 2030",
  address: "12 Analytical Street",
  city: "London",
  notes: "Leave at the front desk",
};

const product: Product = {
  id: "01t000000000001AAA",
  name: "Nike run 1 red",
  productCode: "NIKE-RUN-1",
  description: null,
  category: "Footwear",
  imageUrl: "https://images.unsplash.com/product-1",
  sizes: ["42", "43"],
  stock: 3,
  price: 60,
};

describe("checkout customer validation", () => {
  it("requires a full name", () => {
    expect(checkoutCustomerSchema.safeParse({ ...validCustomer, fullName: "" }).success).toBe(
      false,
    );
  });

  it("requires a valid email format", () => {
    expect(
      checkoutCustomerSchema.safeParse({ ...validCustomer, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("requires a phone number", () => {
    expect(checkoutCustomerSchema.safeParse({ ...validCustomer, phone: "" }).success).toBe(false);
  });

  it("requires a shipping address", () => {
    expect(checkoutCustomerSchema.safeParse({ ...validCustomer, address: "" }).success).toBe(false);
  });

  it("requires a city", () => {
    expect(checkoutCustomerSchema.safeParse({ ...validCustomer, city: "" }).success).toBe(false);
  });

  it("allows order notes to be empty", () => {
    expect(checkoutCustomerSchema.safeParse({ ...validCustomer, notes: "" }).success).toBe(true);
  });
});

describe("order construction", () => {
  it("uses the live catalog price rather than a browser-supplied price", () => {
    const [line] = resolveOrderItems(
      [{ productId: product.id, size: "42", quantity: 2 }],
      [product],
    );

    expect(line?.price).toBe(60);
    expect(line?.quantity).toBe(2);
  });

  it("rejects quantities above live stock, including duplicate lines", () => {
    expect(() =>
      resolveOrderItems(
        [
          { productId: product.id, size: "42", quantity: 2 },
          { productId: product.id, size: "42", quantity: 2 },
        ],
        [product],
      ),
    ).toThrow("Only 3 units are available");
  });

  it("formats the order number, SKU, size, quantity, promo, total and notes for Salesforce", () => {
    const items = resolveOrderItems(
      [{ productId: product.id, size: "42", quantity: 2 }],
      [product],
    );
    const description = buildOrderDescription(
      "ORD-A2345",
      items,
      "SFCC20",
      cartTotals(items, "SFCC20"),
      validCustomer.notes,
    );

    expect(description).toContain("Order Number: ORD-A2345");
    expect(description).toContain("SKU: NIKE-RUN-1 | Size: 42 | Qty: 2");
    expect(description).toContain("Promo Code: SFCC20");
    expect(description).toContain("Total Amount: $96.00");
    expect(description).toContain("Customer Notes: Leave at the front desk");
  });
});
