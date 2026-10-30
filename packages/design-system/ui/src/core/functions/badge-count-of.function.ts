/**
 * Stackra file contract:
 * Purpose: `badgeCountOf(count, locale)`, a count as a badge shows it: the locale's digits, capped at "99+".
 * Boundary: pure; internal, imported by path. Zero and less is the empty string, so the caller draws no badge.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28); ADR 0060; ADR 0192 (digits: the customer's setting, the tag's `-u-nu-` keyword by default).
 */

import { type NumberingSystem, numberFormatIn, numeralsOf } from "@stackra/i18n";

/** The largest count a badge spells out. */
const CAP = 99;

/** The count in the locale's digits, "99+" past the cap, "" for none. */
export function badgeCountOf(
  count: number,
  locale: string,
  numerals: NumberingSystem = numeralsOf(locale),
): string {
  if (count <= 0) return "";
  const format = numberFormatIn(locale, undefined, numerals);
  return count > CAP ? `${format.format(CAP)}+` : format.format(count);
}
