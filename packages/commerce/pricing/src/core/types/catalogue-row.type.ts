/**
 * Stackra file contract:
 * Purpose: `CatalogueRow`, one row of a plan-catalogue admin record version (`price-list:<product>`, `offer:<name>`,
 *          `rate-card:<name>`) as the seed pack and `@stackra/entitlements`' `CatalogueVersion` hold it.
 * Boundary: a type only; untrusted until a reader (`planPriceListsOf`, `offerOf`, `rateCardOf`) checks it.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decision 5); config-model section 6.
 */
import type { Json } from "@stackra/contracts";

/** One record row. */
export type CatalogueRow = Readonly<Record<string, Json>>;
