/**
 * Stackra file contract:
 * Purpose: `IdentifierFormat`, the data that says what one kind of identifier looks like in one Market: a national
 *          ID, a residence permit, a VAT or TRN number, an IBAN, a phone number, a postal code. A market pack carries
 *          it; `checkIdentifier` and `identifier()` apply it.
 * Boundary: a type only. The pattern is a regular expression source matched against the normalised value (spaces and
 *           hyphens removed, letters upper-cased), anchored by its author. No format is written in code.
 * Runtime: isomorphic
 * Governing contract: owner principle 2026-10-25 (configuration, not code); `config-model.md` section 1 (identity:
 *                     formats); round 3 #36.
 */
import type { IdentifierCheck } from "#core/enums/identifier-check.enum";

/**
 * One identifier's shape, from market-pack data.
 *
 * @example
 * const trn: IdentifierFormat = { pattern: "^100\\d{12}$" };
 * const iban: IdentifierFormat = { pattern: "^SA\\d{2}[0-9A-Z]{20}$", check: IdentifierCheck.Mod97 };
 */
export interface IdentifierFormat {
  /** The regular expression source the normalised value must match. */
  readonly pattern: string;

  /** The check-digit or structure algorithm the value must also pass. */
  readonly check?: IdentifierCheck;
}
