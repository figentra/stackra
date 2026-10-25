/**
 * Stackra file contract:
 * Purpose: `TaxRate`, one row of a market pack's tax table: the rate of a tax class in a jurisdiction.
 * Boundary: a type only; market-pack data (dated values are resolved for the sale date before they reach here). The
 *           jurisdiction is the lower-case country (`sa`) or country and subdivision (`us-ny`).
 * Runtime: isomorphic
 * Governing contract: the OS-109 answer (own tax tables); config-model section 1 (tax in the market pack).
 */

/** A rate row. */
export interface TaxRate {
  /** `sa`, `ae`, `us-ny`. */
  readonly jurisdiction: string;

  /** The catalogue's tax class (`standard`, `zero`). */
  readonly taxClass: string;

  /** The rate as a decimal fraction string (`"0.15"`, `"0"`). */
  readonly rate: string;
}
