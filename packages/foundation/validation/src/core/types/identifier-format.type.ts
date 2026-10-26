/**
 * Stackra file contract:
 * Purpose: `IdentifierFormat`, the data that says what one kind of identifier looks like in one Market: a national
 *          ID, a residence permit, a VAT or TRN number, an IBAN, a phone number, a postal code. A market pack carries
 *          it; `checkIdentifier` and `identifier()` apply it.
 * Boundary: a type only. The pattern is a regular expression source matched against the normalised value (spaces and
 *           hyphens removed, letters upper-cased), anchored by its author; `canonical`, when given, rewrites the
 *           match into the stored form from the pattern's groups (`1234AB` to `1234 AB`, `123456789` to
 *           `12345-6789`). No format is written in code.
 * Runtime: isomorphic
 * Governing contract: owner principle 2026-10-25 (configuration, not code); `config-model.md` section 1 (identity:
 *                     formats); round 3 #36; ADR 0403 and ADR 0405 (postal codes and US formats as pack data).
 */
import type { IdentifierCheck } from "#core/enums/identifier-check.enum";

/**
 * One identifier's shape, from market-pack data.
 *
 * @example
 * const trn: IdentifierFormat = { pattern: "^100\\d{12}$" };
 * const iban: IdentifierFormat = { pattern: "^SA\\d{2}[0-9A-Z]{20}$", check: IdentifierCheck.Mod97 };
 * const postcode: IdentifierFormat = { pattern: "^([1-9]\\d{3})(?!SA|SD|SS)([A-Z]{2})$", canonical: "$1 $2" };
 */
export interface IdentifierFormat {
  /** The regular expression source the normalised value must match. */
  readonly pattern: string;

  /** The check-digit or structure algorithm the value must also pass. */
  readonly check?: IdentifierCheck;

  /**
   * The stored form, written from the pattern's groups (`$1 $2`; `$1` to `$9`); the normalised value itself when left
   * out. A group that did not match is left out with the text just before it, so `$1-$2` writes `12345` for a
   * five-digit ZIP and `12345-6789` for ZIP+4. The check runs on the normalised value, before this rewrite.
   */
  readonly canonical?: string;
}
