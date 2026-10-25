/**
 * Stackra file contract:
 * Purpose: `TaxAddress`, where a sale is taxed: the buyer's country, and the region and postal code a sub-national
 *          sales tax needs (ADR 0244 decision 9: tax is destination-based).
 * Boundary: a type only. `country` is ISO 3166-1 alpha-2 and `region` the ISO 3166-2 subdivision suffix (`NY`), both as
 *           the caller has them; a provider driver may need the postal code, the rate table does not.
 * Runtime: isomorphic
 * Governing contract: ADR 0244 (decision 9); the OS-109 answer (own tables, a provider where the market needs one).
 */

/** The destination of a taxed sale. */
export interface TaxAddress {
  /** ISO 3166-1 alpha-2 country (`SA`, `US`). */
  readonly country: string;

  /** The subdivision (`NY`), or null where the country taxes nationally. */
  readonly region: string | null;

  /** The postal code, or null; a provider uses it for local rates. */
  readonly postalCode: string | null;
}
