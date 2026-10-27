/**
 * Stackra file contract:
 * Purpose: `FiscalAddress`, the postal address a fiscal format prints for a seller or buyer.
 * Boundary: a type only; a superset of what the mandates ask (a district for ZATCA, a branch for ETA). Its `country`
 *           is the one `Address` country of `@stackra/validation` (ISO 3166-1 alpha-2, taken from the party's record,
 *           never a constant in a driver). The rest stays a document-format shape on purpose: the mandates split the
 *           street from the building number, carry a branch id and print an absent part as `null`, so a checkout
 *           `Address` is mapped into it at the fiscal boundary rather than merged.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 8); STA-1383 (one home for duplicated value types).
 */
import type { Address } from "@stackra/validation";

/** An address as a fiscal document carries it; optional parts are `null` when the party has none. */
export type FiscalAddress = Pick<Address, "country"> & {
  /** The street name, without the building number. */
  readonly street: string;
  /** Building number, when the address has one. */
  readonly buildingNumber: string | null;
  /** District or neighbourhood, when the address has one. */
  readonly district: string | null;
  /** The city the address is in. */
  readonly city: string;
  /** Region, province or governorate, when the address has one. */
  readonly region: string | null;
  /** Postal code, when the address has one. */
  readonly postalCode: string | null;
  /** The issuer's registered branch id, for formats that ask for one; `null` otherwise. */
  readonly branchId: string | null;
};
