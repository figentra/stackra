/**
 * Stackra file contract:
 * Purpose: `normalizeArabic(text)`, the one Arabic text normaliser search and matching use (ADR 0221, conflict-name
 *          checks): alef and hamza forms to bare alef, taa marbuta to haa, alef maqsura to yaa, diacritics and tatweel
 *          removed, and the "al-" article stripped from the start of each word.
 * Boundary: pure; for comparison keys only, never for display. Non-Arabic text passes through unchanged apart from
 *           collapsed whitespace. Callers keep no copy (ADR 0080 note of 2026-10-24).
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (note of 2026-10-24, STA-456); ADR 0221.
 */

/** Harakat, tanween, shadda, sukun, superscript alef and Quranic marks; and the tatweel. */
const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

/** Alef with madda, hamza above or below, and wasla. */
const ALEFS = /[آأإٱ]/g;

/** The article "ال" at the start of a word of at least two more letters. */
const ARTICLE = /(^|\s)ال(?=\S{2,})/g;

/**
 * The comparison form of `text`.
 *
 * @example
 * normalizeArabic("الْمَدْرَسَةُ"); // "مدرسه"
 * normalizeArabic("أحمد") === normalizeArabic("احمد"); // true
 */
export function normalizeArabic(text: string): string {
  return text
    .normalize("NFC")
    .replace(MARKS, "")
    .replace(ALEFS, "ا")
    .replaceAll("ؤ", "و")
    .replaceAll("ئ", "ي")
    .replaceAll("ة", "ه")
    .replaceAll("ى", "ي")
    .replaceAll(/\s+/g, " ")
    .trim()
    .replace(ARTICLE, "$1");
}
