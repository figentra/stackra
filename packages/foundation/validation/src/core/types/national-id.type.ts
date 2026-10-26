/**
 * Stackra file contract:
 * Purpose: `NationalId`, an identity document number held by a person: the issuing country, the kind of document (a
 *          kind code from that Market's `identity.national_ids` pack value) and the number in its stored form.
 * Boundary: a type only; `nationalId(formats)` is its schema for one Market. It is personal data: a field holding one
 *           carries `@Classified`.
 * Runtime: isomorphic
 * Governing contract: OS parties gap (STA-1269); owner decision R3-2 (the documents ID checks cover).
 */
import type { CountryCode } from "#core/types/country-code.type";

/** An identity document number. */
export interface NationalId {
  /** The issuing country. */
  readonly country: CountryCode;

  /** The document kind, a key of the issuing Market's `identity.national_ids`. */
  readonly kind: string;

  /** The number, normalised and in its Market's stored form. */
  readonly number: string;
}
