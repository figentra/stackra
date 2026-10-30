/**
 * Stackra file contract:
 * Purpose: `highlightPartsOf(text, query)`, a text cut into plain and matched parts in order, from
 *          `highlightRangesOf`, for a Highlight to draw.
 * Boundary: pure; joining the parts gives the text back unchanged.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave A).
 */
import { highlightRangesOf } from "#core/functions/highlight-ranges-of.function";

/** The parts of `text`, each matched or not. */
export function highlightPartsOf(
  text: string,
  query: string | readonly string[],
): readonly { readonly text: string; readonly isMatch: boolean }[] {
  const parts: { text: string; isMatch: boolean }[] = [];
  let at = 0;
  for (const { start, end } of highlightRangesOf(text, query)) {
    if (start > at) parts.push({ text: text.slice(at, start), isMatch: false });
    parts.push({ text: text.slice(start, end), isMatch: true });
    at = end;
  }
  if (at < text.length) parts.push({ text: text.slice(at), isMatch: false });
  return parts;
}
