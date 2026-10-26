/**
 * Stackra file contract:
 * Purpose: `checkIdentifier(value, format)`, the one check of a national ID, residence permit, VAT or TRN number, IBAN
 *          or other identifier against its Market's `IdentifierFormat`: normalise, match the pattern, run the named
 *          algorithm, and return the stored form (the normalised value, rewritten by the format's `canonical` when it
 *          has one) or null.
 * Boundary: pure. The format is market-pack data the caller passes; nothing here knows a country. A malformed pattern
 *           is the pack author's error and throws the `SyntaxError` of `RegExp`.
 * Runtime: isomorphic
 * Governing contract: owner principle 2026-10-25 (configuration, not code); round 3 #36; adapter-readiness #7;
 *                     ADR 0405 (canonical forms).
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
 * `template` filled from `match`: `$1` to `$9` are its groups, and a group that did not match drops with the text just
 * before it.
 */
function rewrite(match: RegExpExecArray, template: string): string {
  return template.replace(/([^$]*)\$(\d)/g, (_, literal: string, index: string) => {
    const group = match[Number(index)];
    return group === undefined ? "" : literal + group;
  });
}

/**
 * The stored form of `value` when it fits `format`, otherwise null.
 *
 * @example
 * checkIdentifier("1012345674", { pattern: "^[12]\\d{9}$", check: IdentifierCheck.Luhn }); // "1012345674" or null
 * checkIdentifier("1234ab", { pattern: "^(\\d{4})([A-Z]{2})$", canonical: "$1 $2" }); // "1234 AB"
 */
export function checkIdentifier(value: string, format: IdentifierFormat): string | null {
  const normalised = normalizeIdentifier(value);
  const match = new RegExp(format.pattern).exec(normalised);
  if (match === null) return null;
  if (format.check !== undefined && !passes(normalised, format.check)) return null;
  return format.canonical === undefined ? normalised : rewrite(match, format.canonical);
}
