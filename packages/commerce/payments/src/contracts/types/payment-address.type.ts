/**
 * Stackra file contract:
 * Purpose: `PaymentAddress`, a postal address a provider needs for risk or for buy-now-pay-later (billing or
 *          shipping).
 * Boundary: a type in the leaf entry; the country is an ISO 3166-1 alpha-2 code the caller takes from its own records or the
 *           Market, never a value in this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 2).
 */

/**
 * Where the customer is.
 *
 * @example
 * const address: PaymentAddress = { line1: "12 King Road", city: "Riyadh", country: market.country };
 */
export interface PaymentAddress {
  /** Street and number. */
  readonly line1: string;

  /** City or town. */
  readonly city: string;

  /** Postal code, when the address has one. */
  readonly postalCode?: string;

  /** ISO 3166-1 alpha-2 country code. */
  readonly country: string;
}
