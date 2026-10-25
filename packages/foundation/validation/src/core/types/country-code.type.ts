/**
 * Stackra file contract:
 * Purpose: `CountryCode`, an ISO 3166-1 alpha-2 country code in upper case (`SA`, `AE`, `EG`, `DE`).
 * Boundary: a type only; `countryCode()` is its schema. A Market code is a market pack's own code (`ae-difc`), not
 *           this.
 * Runtime: isomorphic
 * Governing contract: ISO 3166-1; ADR 0305.
 */

/** Two upper-case letters. */
export type CountryCode = `${Uppercase<string>}`;
