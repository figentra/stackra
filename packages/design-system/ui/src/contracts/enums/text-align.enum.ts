/**
 * Stackra file contract:
 * Purpose: the horizontal alignments of text: `start` and `end` follow the text direction, `center`, and `justify`
 *          (iOS only on native), the four HeroUI v3 and HeroUI Native Typography take.
 * Boundary: the values only; each runtime passes them to HeroUI's `align` unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract); ADR 0060 (right-to-left).
 */

/** The text alignments, in reading order. Verified against `@heroui/styles` 3.2.6 and `heroui-native` 1.0.10. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the alignments carry no labels.
export const TextAlign = Object.freeze(["start", "center", "end", "justify"] as const);

/** One text alignment. */
export type TextAlign = (typeof TextAlign)[number];
