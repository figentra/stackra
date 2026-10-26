/**
 * Stackra file contract:
 * Purpose: `searchWordsOf`, the one normalisation of search text, used for documents and phrases alike: Arabic folded
 *          by `@stackra/i18n`'s `normalizeArabic` (diacritics and tatweel removed, alef and hamza forms, teh marbuta and
 *          alef maqsura unified, the "al-" article stripped), Latin accents removed, lower case, split into words.
 * Boundary: pure. Arabic folding is `normalizeArabic`'s alone (ADR 0080 note: callers keep no copy); this function
 *           adds only the Latin accents, the case and the split. The text function of this package's migration
 *           `search.0003_create_fold_function` (`search.fold`) applies the same folding in SQL, so the trigram index
 *           and the documents agree; change both together, and reindex (ADR 0404).
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 3: Arabic normalisation in the index and in queries; 2026-10-24 note);
 *                     ADR 0080 (note of 2026-10-24); ADR 0404 (one Arabic normaliser, reindex plan).
 */
import { normalizeArabic } from "@stackra/i18n";

// The code points are spelled as escapes inside strings so the formatter keeps them readable (it inlines bare escapes).
/** Combining accents after decomposition (the Latin ones `normalizeArabic` leaves). */
const ACCENTS = new RegExp("[\\u0300-\\u036f]", "gu");

/** Anything that is not a letter, a combining mark of a letter, or a digit. */
const SEPARATOR = /[^\p{L}\p{M}\p{N}]+/u;

/**
 * The normalised words of `text`, in order, repeats kept.
 *
 * @example
 * searchWordsOf("Café-Crème"); // ["cafe", "creme"]
 * searchWordsOf("المَكْتَبَة"); // ["مكتبه"]
 */
export function searchWordsOf(text: string): string[] {
  return normalizeArabic(text)
    .normalize("NFD")
    .replace(ACCENTS, "")
    .normalize("NFC")
    .toLowerCase()
    .split(SEPARATOR)
    .filter((word) => word !== "");
}
