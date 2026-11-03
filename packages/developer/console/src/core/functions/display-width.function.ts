/**
 * Stackra file contract:
 * Purpose: `displayWidth(text)`, the columns `text` takes on a terminal: escapes removed, then one per grapheme
 *          cluster, two for wide East Asian and emoji graphemes, none for combining, format and isolate marks.
 * Boundary: pure; `Intl.Segmenter` is in every runtime the console supports.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-026; Unicode UAX 29 and UAX 11.
 */
import { stripEscapes } from "#core/functions/strip-escapes.function";

/** Grapheme segmenter, shared. */
const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** Graphemes made only of marks and format characters (combining marks, ZWJ, bidi isolates). */
const ZERO = /^[\p{Mn}\p{Me}\p{Cf}]+$/u;

/**
 * Emoji presentation: a pictograph drawn as an emoji by default, or one asked for with U+FE0F. A text-default
 * pictograph (`⚠`, `©`, `↔`) takes one column, as terminals draw it.
 */
const EMOJI = /\p{Emoji_Presentation}|\uFE0F/u;

/** Wide East Asian code points (UAX 11, W and F), the common blocks. */
function isWide(code: number): boolean {
  return (
    (code >= 0x11_00 && code <= 0x11_5f) ||
    (code >= 0x2e_80 && code <= 0xa4_cf && code !== 0x30_3f) ||
    (code >= 0xac_00 && code <= 0xd7_a3) ||
    (code >= 0xf9_00 && code <= 0xfa_ff) ||
    (code >= 0xfe_30 && code <= 0xfe_4f) ||
    (code >= 0xff_00 && code <= 0xff_60) ||
    (code >= 0xff_e0 && code <= 0xff_e6) ||
    (code >= 0x2_00_00 && code <= 0x3_ff_fd)
  );
}

/** The columns `text` takes. */
export function displayWidth(text: string): number {
  let width = 0;
  for (const { segment } of GRAPHEMES.segment(stripEscapes(text))) {
    if (ZERO.test(segment)) continue;
    const code = segment.codePointAt(0) ?? 0;
    width += EMOJI.test(segment) || isWide(code) ? 2 : 1;
  }
  return width;
}
