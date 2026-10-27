/**
 * Stackra file contract:
 * Purpose: `CatalogueRow`, one row of a catalogue admin record version as stored: a JSON object naming its `record`
 *          kind and `id` (`price-list:<product>`, `offer:<name>`, `rate-card:<name>`, a plan). The seed pack and
 *          `@stackra/entitlements`' `CatalogueVersion` hold it; entitlements' `planCatalogueOf` and pricing's
 *          `planPriceListsOf`, `offerOf` and `rateCardOf` read it.
 * Boundary: a type only; untrusted admin or seed data until one of those readers checks it. One home here, below
 *           both pricing and entitlements, so neither depends on the other for it.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decisions 1 and 5); config-model sections 2 and 6; STA-1383 (one home for duplicated
 *                     value types).
 */
import type { Json } from "#core/types/json.type";

/** A stored catalogue row. */
export type CatalogueRow = Readonly<Record<string, Json>>;
