/**
 * Stackra file contract:
 * Purpose: the corners of its anchor a badge can sit on, named by the reading direction (start and end), so one
 *          value puts the badge on the reading-end side in English and in Arabic.
 * Boundary: the values only; `physicalPlacementOf` turns one into HeroUI's physical corner.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0304 (decision 1); ADR 0060 (right-to-left).
 */

/** The badge corners, logical. HeroUI's own values are physical (`top-right`); see `physicalPlacementOf`. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the corners carry no labels.
export const BadgePlacement = Object.freeze([
  "top-end",
  "top-start",
  "bottom-end",
  "bottom-start",
] as const);

/** One badge corner. */
export type BadgePlacement = (typeof BadgePlacement)[number];
