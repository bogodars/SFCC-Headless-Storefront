import { createServerFn } from "@tanstack/react-start";

import {
  isStorefrontProduct,
  mapProductRecord,
  type Product,
  type SalesforceProductRecord,
} from "./catalog";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/salesforce";
const API_PREFIX = "/services/data/v62.0";

const PRODUCTS_SOQL =
  "SELECT Id, Name, ProductCode, Description, Category_c__c, Image_URL__c, Sizes__c, Stock__c, " +
  "(SELECT UnitPrice FROM PricebookEntries WHERE Pricebook2.IsStandard = true AND IsActive = true LIMIT 1) " +
  "FROM Product2 WHERE IsActive = true";

interface QueryResponse {
  records: SalesforceProductRecord[];
  done: boolean;
  nextRecordsUrl?: string;
}

export const getProducts = createServerFn({ method: "GET" }).handler(async (): Promise<Product[]> => {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const salesforceKey = process.env["SALESFORCE_API_KEY"];
  if (!lovableKey || !salesforceKey) {
    throw new Error("The store isn't connected to Salesforce right now.");
  }

  const records: SalesforceProductRecord[] = [];
  let path: string | undefined = `/query?q=${encodeURIComponent(PRODUCTS_SOQL)}`;

  for (let page = 0; path && page < 20; page++) {
    const response = await fetch(`${GATEWAY_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": salesforceKey,
      },
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`Salesforce product query failed [${response.status}]: ${body}`);
      throw new Error(`We couldn't load the catalog from Salesforce (error ${response.status}).`);
    }
    const json = (await response.json()) as QueryResponse;
    records.push(...json.records);
    path = !json.done && json.nextRecordsUrl ? json.nextRecordsUrl.replace(API_PREFIX, "") : undefined;
  }

  return records.map(mapProductRecord).filter(isStorefrontProduct);
});
