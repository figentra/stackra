/**
 * Stackra file contract:
 * Purpose: `FiscalAddress`, the postal address a fiscal format prints for a seller or buyer.
 * Boundary: a type only; a superset of what the mandates ask (a district for ZATCA, a branch for ETA). `country` is an
 *           ISO 3166-1 alpha-2 code taken from the party's record, never a constant in a driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8).
 */

/** An address as a fiscal document carries it; optional parts are `null` when the party has none. */
export type FiscalAddress = {
  /** Street name. */
  readonly street: string;
  /** Building number, when the address has one. */
  readonly buildingNumber: string | null;
  /** District or neighbourhood, when the address has one. */
  readonly district: string | null;
  /** City. */
  readonly city: string;
  /** Region, province or governorate, when the address has one. */
  readonly region: string | null;
  /** Postal code, when the address has one. */
  readonly postalCode: string | null;
  /** ISO 3166-1 alpha-2 country code. */
  readonly country: string;
  /** The issuer's registered branch id, for formats that ask for one; `null` otherwise. */
  readonly branchId: string | null;
};
