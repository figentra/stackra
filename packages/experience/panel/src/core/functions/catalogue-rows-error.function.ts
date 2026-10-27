/**
 * Stackra file contract:
 * Purpose: `catalogueRowsError(kind, key, rows)`, why a proposed plan-catalogue record cannot be used, or `undefined`
 *          when its kind's reader accepts it: `plan-catalogue` through `planCatalogueOf`, `price-list` through
 *          `planPriceListsOf`, `offer` through `offerOf` and `rate-card` through `rateCardOf`.
 * Boundary: pure; internal: the `./react` proposal form imports it by path, so an admin sees the reader's message before
 *           proposing. A kind with no reader here (`fee-schedule`, read by the registry) is accepted; the OS billing
 *           action reads every kind again before it stores a version.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decisions 2 and 3); config-model section 2.
 */
import { planCatalogueOf } from "@stackra/entitlements";
import type { CatalogueRow } from "@stackra/contracts";
import { offerOf, planPriceListsOf, rateCardOf } from "@stackra/pricing";

/** Each kind's reader; each throws naming the bad row. */
const READERS: Readonly<Record<string, (key: string, rows: readonly CatalogueRow[]) => unknown>> =
  Object.freeze({
    "plan-catalogue": (_key, rows) => planCatalogueOf(rows),
    "price-list": (_key, rows) => planPriceListsOf(rows),
    offer: (key, rows) => offerOf(key, rows),
    "rate-card": (key, rows) => rateCardOf(key, rows),
  });

/**
 * The reader's complaint about `rows`, or `undefined` when they read.
 *
 * @example
 * catalogueRowsError("price-list", "price-list:commerce", rows); // "planPriceListsOf: row 3 has unknown period weekly"
 */
export function catalogueRowsError(
  kind: string,
  key: string,
  rows: readonly CatalogueRow[],
): string | undefined {
  const reader = READERS[kind];
  if (reader === undefined) return undefined;
  try {
    reader(key, rows);
    return undefined;
  } catch (error) {
    // A reader refuses with a RangeError; Money refuses a bad amount or currency with its own error.
    if (error instanceof Error) return error.message;
    throw error;
  }
}
