/**
 * Stackra file contract:
 * Purpose: `HapticStyle`, the touch feedback an entry documents; the same names as `HapticKind` in `@stackra/ui/native`
 *          (kept here as data so this package stays free of React).
 * Boundary: the values only.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 8; ADR 0305 (one declaration per file).
 */

/** The haptic styles. */
export const HapticStyle = Object.freeze([
  "impact",
  "rigid",
  "selection",
  "success",
  "warning",
  "error",
] as const);

/** One haptic style. */
export type HapticStyle = (typeof HapticStyle)[number];
