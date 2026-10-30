/**
 * Stackra file contract:
 * Purpose: `splitTags(text)`, the tags in typed or pasted text: split on commas (Latin `,` and Arabic `،`),
 *          semicolons and line breaks, trimmed, empty pieces dropped.
 * Boundary: pure; the text is never reordered or reshaped, so Arabic and mixed-direction tags keep their letters.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A, owner request 2026-10-29).
 */

/** The separators between tags. */
const SEPARATORS = /[,،;\n\r]+/u;

/** The tags in `text`. */
export function splitTags(text: string): readonly string[] {
  return text
    .split(SEPARATORS)
    .map((piece) => piece.trim())
    .filter(Boolean);
}
