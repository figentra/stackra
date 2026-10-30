/**
 * Stackra file contract:
 * Purpose: Where a floating action button sits: a bottom corner by reading direction, the bottom centre, or inline in the flow.
 * Boundary: the values only; each runtime maps them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile interactions (owner
 *          approval 2026-10-28).
 */

/** Where a floating action button sits: a bottom corner by reading direction, the bottom centre, or inline in the flow. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the values carry no labels.
export const FabPlacement = Object.freeze([
  "bottom-end",
  "bottom-start",
  "bottom-center",
  "inline",
] as const);

/** One value of `FabPlacement`. */
export type FabPlacement = (typeof FabPlacement)[number];
