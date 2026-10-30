/**
 * Stackra file contract:
 * Purpose: `AddressValue`, a postal address: two lines, the city, the region, the postal code and the country.
 * Boundary: types only; national address formats (Saudi short address, building number) ride in the lines for now.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305.
 */

/** A postal address. */
export interface AddressValue {
  /** The street line. */
  readonly line1: string;
  /** The second line: building, unit, district. */
  readonly line2?: string | undefined;
  /** The city. */
  readonly city: string;
  /** The region, province or state. */
  readonly region?: string | undefined;
  /** The postal code. */
  readonly postalCode?: string | undefined;
  /** The country, as an ISO 3166-1 alpha-2 code. */
  readonly country: string;
}
