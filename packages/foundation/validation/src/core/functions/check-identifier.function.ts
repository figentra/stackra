/**
 * Stackra file contract:
 * Purpose: `checkIdentifier(value, format)`, the one check of a national ID, residence permit, VAT or TRN number, IBAN
 *          or other identifier against its Market's `IdentifierFormat`: normalise, match the pattern, run the named
 *          algorithm, and return the normalised value or null.
 * Boundary: pure. The format is market-pack data the caller passes; nothing here knows a country. A malformed pattern
 *           is the pack author's error and throws the `SyntaxError` of `RegExp`.
 * Runtime: isomorphic
 * Governing contract: owner principle 2026-10-25 (configuration, not code); round 3 #36; adapter-readiness #7.
 */
import { IdentifierCheck } from "#core/enums/identifier-check.enum";
import { centuryBirthDateValid } from "#core/functions/century-birth-date-valid.function";
import { isGtin } from "#core/functions/is-gtin.function";
import { luhnValid } from "#core/functions/luhn-valid.function";
import { mod97Valid } from "#core/functions/mod97-valid.function";
import { normalizeIdentifier } from "#core/functions/normalize-identifier.function";
import type { IdentifierFormat } from "#core/types/identifier-format.type";

/** Whether `value` passes `check`. */
function passes(value: string, check: IdentifierCheck): boolean {
  switch (check) {
    case IdentifierCheck.Luhn:
      return luhnValid(value);
    case IdentifierCheck.Mod97:
      return mod97Valid(value);
    case IdentifierCheck.Gs1:
      return isGtin(value);
    case IdentifierCheck.CenturyBirthDate:
      return centuryBirthDateValid(value);
  }
}

/**
 * The normalised `value` when it fits `format`, otherwise null.
 *
 * @example
 * checkIdentifier("1012345674", { pattern: "^[12]\\d{9}$", check: IdentifierCheck.Luhn }); // "1012345674" or null
 */
export function checkIdentifier(value: string, format: IdentifierFormat): string | null {
  const normalised = normalizeIdentifier(value);
  if (!new RegExp(format.pattern).test(normalised)) return null;
  if (format.check !== undefined && !passes(normalised, format.check)) return null;
  return normalised;
}
