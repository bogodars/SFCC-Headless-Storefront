import { createServerFn } from "@tanstack/react-start";

import { fetchStorefrontProducts } from "./catalog.server";
import { cartTotals, normalizePromo } from "./cart";
import { buildOrderDescription, checkoutOrderSchema, resolveOrderItems } from "./checkout";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/salesforce";
const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

interface SalesforceCreateResponse {
  id?: string;
  success?: boolean;
  errors?: { message?: string }[];
}

function createOrderNumber() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(5));
  const suffix = [...bytes].map((byte) => ORDER_ALPHABET[byte % ORDER_ALPHABET.length]).join("");
  return `ORD-${suffix}`;
}

export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => checkoutOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const salesforceKey = process.env["SALESFORCE_API_KEY"];
    if (!lovableKey || !salesforceKey) {
      throw new Error("The store isn't connected to Salesforce right now. Please try again later.");
    }

    const promoCode = data.promoCode === null ? null : normalizePromo(data.promoCode);
    if (data.promoCode !== null && promoCode === null) {
      throw new Error("The promo code is no longer valid.");
    }

    // Re-read the live catalog and rebuild every line instead of trusting browser prices.
    const products = await fetchStorefrontProducts(lovableKey, salesforceKey);
    const items = resolveOrderItems(data.items, products);
    const totals = cartTotals(items, promoCode);
    const orderNumber = createOrderNumber();
    const description = buildOrderDescription(
      orderNumber,
      items,
      promoCode,
      totals,
      data.customer.notes,
    );

    const response = await fetch(`${GATEWAY_URL}/sobjects/Lead`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": salesforceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        LastName: data.customer.fullName,
        Company: "SFCC Headless Storefront Customer",
        Email: data.customer.email,
        Phone: data.customer.phone,
        Street: data.customer.address,
        City: data.customer.city,
        LeadSource: "Web",
        Description: description,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Salesforce Lead creation failed [${response.status}]: ${body}`);
      throw new Error(
        `We couldn't submit your order to Salesforce (error ${response.status}). Please try again.`,
      );
    }

    const result = (await response.json()) as SalesforceCreateResponse;
    if (!result.success || !result.id) {
      const detail = result.errors
        ?.map((error) => error.message)
        .filter(Boolean)
        .join("; ");
      console.error(`Salesforce rejected the Lead: ${detail || "Unknown error"}`);
      throw new Error(
        "Salesforce couldn't accept your order. Please review your details and try again.",
      );
    }

    return {
      orderNumber,
      leadId: result.id,
      items,
      promoCode,
      totals,
      customer: data.customer,
    };
  });
