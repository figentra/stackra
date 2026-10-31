/**
 * Stackra file contract:
 * Purpose: the label roles that are safe on a material, Apple's vibrancy ladder in Stackra's roles: `primary`
 *          (foreground), `secondary` (muted), `tertiary` (muted at 70%, inactive text only), `glyph` (icons) and
 *          `on-media` (white over clear glass's dim).
 * Boundary: the names only; which level allows which is `materials.levels.<level>.vibrancy`.
 * Runtime: isomorphic
 * Governing contract: ADR 0320 (the glass material); ADR 0501 (tokens v2, the materials block).
 */

/** The label roles a material level may carry. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128).
export const VibrancyRole = Object.freeze([
  "primary",
  "secondary",
  "tertiary",
  "glyph",
  "on-media",
] as const);

/** One label role. */
export type VibrancyRole = (typeof VibrancyRole)[number];
