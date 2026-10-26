/**
 * Stackra file contract:
 * Purpose: `priceListKey`, the key of a plan price list: its regional price tier and its price currency.
 * Boundary: pure. The pair is the whole key (R3-SO-14), so `low` in USD and `low` in EGP are two lists.
 * Runtime: isomorphic
 * Governing contract: ADR 0392 (decision 1); owner R3-SO-14.
 */

/**
 * The key of the list for `regionalTier` in `priceCurrency`.
 *
 * @example
 * priceListKey("low", "USD"); // "low:USD"
 */
export function priceListKey(regionalTier: string, priceCurrency: string): string {
  return `${regionalTier}:${priceCurrency}`;
}
