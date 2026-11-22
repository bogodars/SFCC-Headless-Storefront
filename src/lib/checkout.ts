import { z } from "zod";

import { canPurchase, formatPrice, type Product } from "./catalog";
import { cartTotals, lineIdFor, type CartItem } from "./cart";

export const checkoutCustomerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(100, "Keep your name under 100 characters."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address.")
    .max(255, "Keep your email under 255 characters."),
  phone: z
    .string()
    .trim()
    .min(1, "Enter your phone number.")
    .max(25, "Keep your phone number under 25 characters.")
    .regex(/^[+()\d\s.-]+$/, "Enter a valid phone number."),
  address: z
    .string()
    .trim()
    .min(3, "Enter your shipping address.")
    .max(200, "Keep your address under 200 characters."),
  city: z
    .string()
    .trim()
    .min(2, "Enter your city.")
    .max(100, "Keep your city under 100 characters."),
  notes: z.string().trim().max(1000, "Keep order notes under 1,000 characters."),
});

export const checkoutOrderSchema = z.object({
  customer: checkoutCustomerSchema,
  items: z
    .array(
      z.object({
        productId: z.string().regex(/^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$/, "Invalid product."),
        size: z.string().trim().max(20).nullable(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(50, "Too many order lines."),
  promoCode: z.string().max(20).nullable(),
});

export type CheckoutCustomer = z.infer<typeof checkoutCustomerSchema>;
export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>;
export type OrderItemInput = CheckoutOrderInput["items"][number];

/** Rebuild cart lines from live products so client-supplied prices and stock are never trusted. */
export function resolveOrderItems(inputs: OrderItemInput[], products: Product[]): CartItem[] {
  const consolidated = new Map<string, OrderItemInput>();
  for (const input of inputs) {
    const key = lineIdFor(input.productId, input.size);
    const existing = consolidated.get(key);
    consolidated.set(key, {
      ...input,
      quantity: (existing?.quantity ?? 0) + input.quantity,
    });
  }

  return [...consolidated.values()].map((input) => {
    const product = products.find((candidate) => candidate.id === input.productId);
    if (!product || !canPurchase(product)) {
      throw new Error("A product in your cart is no longer available. Please review your cart.");
    }
    if (product.sizes.length > 0 && (!input.size || !product.sizes.includes(input.size))) {
      throw new Error(`Select a valid size for ${product.name}.`);
    }
    if (product.sizes.length === 0 && input.size !== null) {
      throw new Error(`${product.name} does not have selectable sizes.`);
    }
    if (input.quantity > product.stock) {
      throw new Error(
        `Only ${product.stock} unit${product.stock === 1 ? " is" : "s are"} available for ${product.name}.`,
      );
    }
    if (product.price === null) throw new Error(`${product.name} is not available for purchase.`);

    return {
      lineId: lineIdFor(product.id, input.size),
      productId: product.id,
      name: product.name,
      productCode: product.productCode,
      imageUrl: product.imageUrl,
      price: product.price,
      size: input.size,
      quantity: input.quantity,
      maxStock: product.stock,
    };
  });
}

export function buildOrderDescription(
  orderNumber: string,
  items: CartItem[],
  promoCode: string | null,
  totals: ReturnType<typeof cartTotals>,
  notes: string,
): string {
  const lines = items.flatMap((item, index) => [
    `${index + 1}. ${item.name}`,
    `   SKU: ${item.productCode ?? "—"} | Size: ${item.size ?? "One size"} | Qty: ${item.quantity} | Unit Price: ${formatPrice(item.price)} | Line Total: ${formatPrice(item.price * item.quantity)}`,
  ]);

  return [
    `Order Number: ${orderNumber}`,
    "",
    "Items:",
    ...lines,
    "",
    `Subtotal: ${formatPrice(totals.subtotal)}`,
    `Promo Code: ${promoCode ?? "None"}`,
    `Discount: ${formatPrice(totals.discount)}`,
    `Total Amount: ${formatPrice(totals.total)}`,
    `Customer Notes: ${notes || "None"}`,
  ].join("\n");
}
