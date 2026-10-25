/**
 * Stackra file contract:
 * Purpose: `arabiziOf`, the Arabic spelling of a word typed in Arabizi (the Latin-script chat alphabet: `7abibi`,
 *          `3arabi`, `mar7aba`), so a search for it also finds the Arabic text; `undefined` for a word that is not
 *          Arabizi.
 * Boundary: pure, and only for search recall: the result is an extra alternative, never a replacement, so a wrong
 *           guess widens a search a little and hides nothing. A word counts as Arabizi only when it mixes Latin letters
 *           with one of the Arabizi digits (2 3 5 6 7 8 9), so English words and plain numbers pass through. Short
 *           vowels are dropped except a leading or final `a` (alef); the output is folded with `searchWordsOf`, the
 *           one normalisation of the index.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 3: Arabic in the index and in queries); OS-173 (Arabizi expansion).
 */
import { searchWordsOf } from "#core/functions/search-words-of.function";

/** Letters and digits with an Arabizi digit among Latin letters. */
const ARABIZI = /^(?=.*[a-z])(?=.*[2356789])[a-z0-9]+$/;

/** Two-letter sounds, matched before single letters. */
const DIGRAPHS: ReadonlyMap<string, string> = new Map([
  ["sh", "ش"],
  ["kh", "خ"],
  ["gh", "غ"],
  ["th", "ث"],
  ["dh", "ذ"],
]);

/** Single letters and digits; vowels are handled apart. */
const LETTERS: ReadonlyMap<string, string> = new Map([
  ["2", "ء"],
  ["3", "ع"],
  ["5", "خ"],
  ["6", "ط"],
  ["7", "ح"],
  ["8", "ق"],
  ["9", "ص"],
  ["b", "ب"],
  ["p", "ب"],
  ["t", "ت"],
  ["j", "ج"],
  ["g", "ج"],
  ["d", "د"],
  ["r", "ر"],
  ["z", "ز"],
  ["s", "س"],
  ["f", "ف"],
  ["v", "ف"],
  ["q", "ق"],
  ["k", "ك"],
  ["c", "ك"],
  ["l", "ل"],
  ["m", "م"],
  ["n", "ن"],
  ["h", "ه"],
  ["w", "و"],
  ["y", "ي"],
  ["i", "ي"],
  ["o", "و"],
  ["u", "و"],
]);

/**
 * The Arabic spelling of the Arabizi `word`, or `undefined`.
 *
 * @example
 * arabiziOf("7abibi"); // "حبيبي"
 * arabiziOf("linen"); // undefined
 */
export function arabiziOf(word: string): string | undefined {
  const latin = word.toLowerCase();
  if (!ARABIZI.test(latin)) return undefined;
  let arabic = "";
  for (let index = 0; index < latin.length;) {
    const digraph = DIGRAPHS.get(latin.slice(index, index + 2));
    if (digraph !== undefined) {
      arabic += digraph;
      index += 2;
      continue;
    }
    const letter = latin[index] ?? "";
    const edge = index === 0 || index === latin.length - 1;
    if (letter === "a") arabic += edge ? "ا" : "";
    else if (letter !== "e") arabic += LETTERS.get(letter) ?? "";
    index += 1;
  }
  return searchWordsOf(arabic)[0];
}
