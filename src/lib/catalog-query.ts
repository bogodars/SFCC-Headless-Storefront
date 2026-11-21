import { queryOptions } from "@tanstack/react-query";

import { getProducts } from "./catalog.functions";

export const productsQueryOptions = queryOptions({
  queryKey: ["salesforce", "products"],
  queryFn: () => getProducts(),
  staleTime: 60_000,
});
