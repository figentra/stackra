/**
 * Stackra file contract:
 * Purpose: `CustomsId`, one customs or tax identifier of the shipper on a cross-border label.
 * Boundary: a read-only data shape in the leaf entry; never a secret. The value is sent as given.
 * Runtime: isomorphic
 * Governing contract: ADR 0369.
 */
import type { CustomsIdKind } from "#contracts/enums/customs-id-kind.enum";

/** A shipper's customs or tax identifier. */
export interface CustomsId {
  /** What kind of identifier it is. */
  readonly kind: CustomsIdKind;

  /** The identifier as the authority issued it (`DE123456789012345`). */
  readonly value: string;

  /** The ISO 3166 alpha-2 country that issued it, when the kind alone does not say (a VAT number). */
  readonly country?: string;
}
