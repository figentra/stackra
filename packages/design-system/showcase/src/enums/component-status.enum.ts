/**
 * Stackra file contract:
 * Purpose: `ComponentStatus`, the chip an entry wears: HeroUI's `new | updated | preview`, `planned` for a registered
 *          component that is not built yet (the P1 gap list), and the lifecycle words `beta` and `stable` (an entry
 *          with no status reads as stable on its doc page).
 * Boundary: the values only.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2; ADR 0305 (one declaration per file).
 */

/** The status chip values. */
export const ComponentStatus = Object.freeze([
  "new",
  "updated",
  "preview",
  "planned",
  "beta",
  "stable",
] as const);

/** One status. */
export type ComponentStatus = (typeof ComponentStatus)[number];
