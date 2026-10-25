/**
 * Stackra file contract:
 * Purpose: `searchWordsOf`, the one normalisation of search text, used for documents and phrases alike: accents and
 *          Arabic diacritics removed, Arabic letter variants unified, lower case, split into words.
 * Boundary: pure. Hamza forms (أ إ آ ؤ ئ) lose their hamza through the canonical decomposition; alef wasla, alef
 *           maqsura and teh marbuta fold to alef, yeh and heh. The text function of this package's migration
 *           (`search.unaccent_immutable`) applies the same folding in SQL, so the trigram index and the documents
 *           agree; change both together.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 3: Arabic normalisation in the index and in queries).
 */

// The code points are spelled as escapes inside strings so the formatter keeps them readable (it inlines bare escapes).
/** Combining accents (after decomposition), the tatweel, the tashkeel and the superscript alef. */
const MARKS = new RegExp("[\\u0300-\\u036f\\u0640\\u064b-\\u065f\\u0670]", "gu");

/** The Arabic letter variants folded to one form. */
const VARIANT = new RegExp("[\\u0671\\u0649\\u0629]", "gu");

/** Alef wasla to alef, alef maqsura to yeh, teh marbuta to heh. */
const FOLDED: ReadonlyMap<string, string> = new Map(
  [
    [0x0671, 0x0627],
    [0x0649, 0x064a],
    [0x0629, 0x0647],
  ].map(([from = 0, to = 0]) => [String.fromCodePoint(from), String.fromCodePoint(to)]),
);

/** Anything that is not a letter, a combining mark of a letter, or a digit. */
const SEPARATOR = /[^\p{L}\p{M}\p{N}]+/u;

/**
 * The normalised words of `text`, in order, repeats kept.
 *
 * @example
 * searchWordsOf("Café-Crème"); // ["cafe", "creme"]
 * searchWordsOf("مَكْتَبَة"); // ["مكتبه"]
 */
export function searchWordsOf(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(MARKS, "")
    .normalize("NFC")
    .replace(VARIANT, (letter) => FOLDED.get(letter) ?? letter)
    .toLowerCase()
    .split(SEPARATOR)
    .filter((word) => word !== "");
}
