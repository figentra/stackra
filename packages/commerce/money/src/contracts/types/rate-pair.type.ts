/**
 * Stackra file contract:
 * Purpose: `RatePair`, what a rate is asked for: one unit of `base` priced in `quote` (`USD` in `SAR`), or, for a
 *          commodity, one `unit` of it (`XAU` per `gram` in `SAR`, the daily metal rate).
 * Boundary: a type only. `base` is an ISO 4217 code or a commodity code (`XAU`, `XAG`); `quote` is always a currency
 *           with minor units; `unit` is null for a currency pair. Which source answers a pair is market-pack data.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (decision 3: FX stores the rate and its source); ADR 0244 (decision 9: a snapshot at
 *                     checkout).
 */

/** A pair a rate source prices. */
export interface RatePair {
  /** The priced currency or commodity, upper case (`USD`, `XAU`). */
  readonly base: string;

  /** The currency the price is in (`SAR`). */
  readonly quote: string;

  /** The commodity unit one rate prices (`gram`, `troy_ounce`); null for a currency pair. */
  readonly unit: string | null;
}
