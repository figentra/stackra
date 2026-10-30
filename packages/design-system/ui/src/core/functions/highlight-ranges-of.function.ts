/**
 * Stackra file contract:
 * Purpose: `highlightRangesOf(text, terms)`, where search terms occur in a text, matching the way people type:
 *          ignoring case, Arabic diacritics (tashkeel) and tatweel, and the alef, yaa and taa marbuta variants.
 *          Each range is on the original text and takes in the marks that follow its last letter, so a highlight
 *          never cuts a letter from its diacritics.
 * Boundary: pure; ranges are sorted and merged. The text is never changed or reordered, so the caller can wrap the
 *           ranges in marks without breaking Arabic letter joining.
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (Arabic); STA-1371 (wave A: Highlight must keep Arabic joined).
 */
import type { TextRange } from "#core/types/text-range.type";

/** Arabic marks that ride on a letter: tashkeel, Quranic marks, superscript alef, and tatweel. */
const MARK = /[ؐ-ؚـً-ٰٟۖ-ۜ۟-۪ۨ-ۭ]/u;

/** Letter variants folded together. */
const FOLD: Readonly<Record<string, string>> = {
  آ: "ا",
  أ: "ا",
  إ: "ا",
  ٱ: "ا",
  ى: "ي",
  ة: "ه",
};

/** The text without marks, folded, with each kept character's offset in the original. */
function folded(text: string): { readonly value: string; readonly at: readonly number[] } {
  let value = "";
  const at: number[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index] ?? "";
    if (MARK.test(char)) continue;
    const lower = (FOLD[char] ?? char).toLocaleLowerCase();
    // Lower-casing that changes the length (rare, such as "İ") keeps the original, so offsets stay one to one.
    value += lower.length === 1 ? lower : char;
    at.push(index);
  }
  return { value, at };
}

/**
 * The ranges of `terms` in `text`.
 * @param text - the text shown
 * @param terms - one search, or several; empty ones are ignored
 */
export function highlightRangesOf(
  text: string,
  terms: string | readonly string[],
): readonly TextRange[] {
  const source = folded(text);
  const ranges: TextRange[] = [];
  for (const term of typeof terms === "string" ? [terms] : terms) {
    const needle = folded(term.trim()).value;
    if (!needle) continue;
    for (
      let from = source.value.indexOf(needle);
      from !== -1;
      from = source.value.indexOf(needle, from + needle.length)
    ) {
      const start = source.at[from] ?? 0;
      let end = (source.at[from + needle.length - 1] ?? start) + 1;
      while (end < text.length && MARK.test(text[end] ?? "")) end += 1;
      ranges.push({ start, end });
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const merged: TextRange[] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range.start <= last.end)
      merged[merged.length - 1] = { start: last.start, end: Math.max(last.end, range.end) };
    else merged.push(range);
  }
  return merged;
}
