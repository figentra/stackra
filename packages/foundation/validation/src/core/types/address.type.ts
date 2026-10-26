/**
 * Stackra file contract:
 * Purpose: `Address`, a postal address in the parts every Market's format draws from: lines, district, locality,
 *          region, postal code, the national short address and the country.
 * Boundary: a type only; `address(format)` is its schema for one Market, and `@stackra/i18n` lays it out for display.
 *           Which parts a Market requires, and in what order it prints them, is its `AddressFormat` (pack data).
 * Runtime: isomorphic
 * Governing contract: OS-370 and COM-117 (address formats per country in the market pack); ADR 0305.
 */
import type { CountryCode } from "#core/types/country-code.type";

/** A postal address. */
export interface Address {
  /** Street, building and unit lines, first line first. */
  readonly lines: readonly string[];

  /** The district or neighbourhood. */
  readonly district?: string;

  /** The city or town. */
  readonly locality?: string;

  /** The region, province, emirate or governorate. */
  readonly region?: string;

  /** The postal code. */
  readonly postalCode?: string;

  /** A national short address (the Saudi national address short code), when the Market has one. */
  readonly shortCode?: string;

  /** The country of the address. */
  readonly country: CountryCode;
}
