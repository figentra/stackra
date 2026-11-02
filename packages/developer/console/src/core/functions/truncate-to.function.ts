/**
 * Stackra file contract:
 * Purpose: `truncateTo(text, width)`, `text` cut by grapheme to at most `width` columns, ending in `…` when cut.
 * Boundary: pure; for plain text (a cell before it is painted).
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-008 (EC-02).
 */
import { displayWidth } from "#core/functions/display-width.function";

/** Grapheme segmenter, shared. */
const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** `text` fitted to `width` columns. */
export function truncateTo(text: string, width: number): string {
  if (displayWidth(text) <= width) return text;
  let kept = "";
  for (const { segment } of GRAPHEMES.segment(text)) {
    if (displayWidth(`${kept}${segment}`) > width - 1) break;
    kept += segment;
  }
  return `${kept}…`;
}
