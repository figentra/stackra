/**
 * Stackra file contract:
 * Purpose: the initials an avatar draws for a name: the first letter of the first and of the last word, upper-cased
 *          in the given locale; one letter for an Arabic-script name, whose two letters would join into a word.
 * Boundary: pure function; no React, no runtime API beyond `String` and `RegExp`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: the same output on web and native); ADR 0304; ADR 0060 (Arabic and RTL).
 */

/** Any letter of the Arabic script blocks (Arabic, Supplement, Extended-A, Presentation Forms A and B). */
const ARABIC_LETTER = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/u;

/**
 * Returns the initials of a name in a locale, or an empty string when the name has no word.
 * @param name - the full name, for example `Ada Lovelace`
 * @param locale - the BCP 47 locale the letters are upper-cased in
 * @returns the initials, for example `AL`
 */
// shortcut: code points, not grapheme clusters; a name starting with a combining mark or a ZWJ emoji keeps only its
// first code point. Upgrade to Intl.Segmenter when Hermes ships it.
export function initialsOf(name: string, locale?: string): string {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  const first = Array.from(words[0] ?? "")[0] ?? "";
  if (first === "" || ARABIC_LETTER.test(first)) return first;
  const last = words.length > 1 ? (Array.from(words.at(-1) ?? "")[0] ?? "") : "";
  return (first + last).toLocaleUpperCase(locale);
}
