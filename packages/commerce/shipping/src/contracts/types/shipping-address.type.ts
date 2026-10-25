/**
 * Stackra file contract:
 * Purpose: `ShippingAddress`, a postal address as a carrier needs it: street lines, city, optional region and postal
 *          code, the country code and, where the market addresses by location, coordinates.
 * Boundary: a type in the leaf entry. Personal data: it locates a person. Address formats and validation per country
 *           are market-pack data applied by OS geography before a request is built; this type only carries the result.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2); ADR 0363 (decision 3: address format is pack data).
 */

/**
 * A delivery or collection address.
 *
 * @example
 * const address: ShippingAddress = { lines: ["Building 7, Street 12"], city: "Springfield", country: "XX" };
 */
export interface ShippingAddress {
  /** Street lines, first line first. */
  readonly lines: readonly string[];

  /** City or locality. */
  readonly city: string;

  /** Region, state or province, where the country uses one. */
  readonly region?: string;

  /** Postal code, where the country uses one. */
  readonly postalCode?: string;

  /** ISO 3166-1 alpha-2 country code. */
  readonly country: string;

  /** Latitude and longitude in decimal degrees, where the address is a pin. */
  readonly coordinates?: { readonly latitude: number; readonly longitude: number };
}
