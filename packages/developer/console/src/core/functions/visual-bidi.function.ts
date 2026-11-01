/**
 * Stackra file contract:
 * Purpose: `visualBidi(text)`, `text` in visual order for a terminal without bidi or shaping (xterm.js, iTerm2): each
 *          right-to-left run is shaped and its graphemes reversed, digit groups inside a run keeping their order, so a
 *          left-to-right line shows the run as a reader expects.
 * Boundary: pure; used only when `decideMode` chose visual bidi. A terminal that applies bidi itself must get logical
 *           text, or the run is reversed twice.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-026; Unicode UAX 9 (reordering resolved levels).
 */
import { RTL_RUN } from "#core/constants/rtl-run.constant";
import { shapeArabic } from "#core/functions/shape-arabic.function";

/** Grapheme segmenter, shared. */
const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** One run, shaped and reversed, with digit groups kept left to right. */
function reverseRun(run: string): string {
  return (run.match(/\p{N}+|\P{N}+/gu) ?? [])
    .toReversed()
    .map((part) =>
      /^\p{N}+$/u.test(part)
        ? part
        : [...GRAPHEMES.segment(shapeArabic(part))]
            .map(({ segment }) => segment)
            .toReversed()
            .join(""),
    )
    .join("");
}

/** `text` with every right-to-left run in visual order. */
export function visualBidi(text: string): string {
  return text.replaceAll(RTL_RUN, reverseRun);
}
