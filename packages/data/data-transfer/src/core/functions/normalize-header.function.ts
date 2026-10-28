/**
 * Stackra file contract:
 * Purpose: `normalizeHeader`, the form a column header is compared in: NFKC; no byte order mark, invisible direction
 *          marks, Arabic diacritics or tatweel; one alef for its hamza and madda forms; ya for alef maqsura; ASCII
 *          digits for Arabic-Indic ones; one space for runs of spaces, `_` and `-`; lower case.
 * Boundary: pure, for matching only; the header shown to the user is never rewritten.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 5).
 */

const INVISIBLE = /[﻿​-‏؜‪-‮⁦-⁩]/g;
const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const ALEF_FORMS = /[آأإٱ]/g;
const ARABIC_INDIC_DIGITS = /[٠-٩۰-۹]/g;

/**
 * `header` in its comparable form.
 *
 * @example
 * normalizeHeader("  الإسـمُ ") === normalizeHeader("الاسم"); // true
 * normalizeHeader("Unit_Price") === normalizeHeader("unit price"); // true
 */
export function normalizeHeader(header: string): string {
  return (
    header
      .normalize("NFKC")
      .replace(INVISIBLE, "")
      .replace(ARABIC_MARKS, "")
      .replace(ALEF_FORMS, "ا")
      .replaceAll("ى", "ي")
      // oxlint-disable-next-line unicorn/prefer-code-point -- reads one character the pattern or loop already limits to the BMP, where code unit and code point agree
      .replace(ARABIC_INDIC_DIGITS, (digit) => String((digit.charCodeAt(0) - 0x06_60) % 0x90))
      .replaceAll(/[\s_-]+/g, " ")
      .trim()
      .toLowerCase()
  );
}
