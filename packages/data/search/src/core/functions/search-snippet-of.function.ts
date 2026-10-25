/**
 * Stackra file contract:
 * Purpose: `searchSnippetOf`, the excerpt of a text around the first word of a search that it contains, with an
 *          ellipsis where it was cut, for a result list.
 * Boundary: pure. A word matches as the start of a word of the text, compared in the one search normalisation, so an
 *           Arabic word matches with or without its diacritics; the excerpt is cut from the original text, at most
 *           `radius` characters each side, on word boundaries. `undefined` when no word occurs. Whether a field may be
 *           excerpted at all is the caller's (`SearchIndex.snippets` and the data class of the field).
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 3 and 6); ADR 0341 (decision 2: the `search` effect).
 */
import { searchWordsOf } from "#core/functions/search-words-of.function";

/** One run of letters, marks or digits. */
const WORD = /[\p{L}\p{M}\p{N}]+/gu;

/**
 * The excerpt of `text` around the first of `words` it contains.
 *
 * @param words - the search's normalised words.
 * @param radius - the most characters kept before and after the match.
 * @example
 * searchSnippetOf("The linen shirt comes in white and sand.", ["shirt"], 6); // "…linen shirt comes…"
 */
export function searchSnippetOf(
  text: string,
  words: readonly string[],
  radius = 60,
): string | undefined {
  for (const match of text.matchAll(WORD)) {
    const [folded] = searchWordsOf(match[0]);
    if (folded === undefined || !words.some((word) => folded.startsWith(word))) continue;
    const at = match.index;
    let start = Math.max(0, at - radius);
    let end = Math.min(text.length, at + match[0].length + radius);
    // Mid-word cuts move to the next word boundary on each side.
    if (start > 0 && !/\s/.test(text[start - 1] ?? ""))
      start = text.indexOf(" ", start) + 1 || start;
    if (end < text.length) end = text.lastIndexOf(" ", end) > at ? text.lastIndexOf(" ", end) : end;
    return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
  }
  return undefined;
}
