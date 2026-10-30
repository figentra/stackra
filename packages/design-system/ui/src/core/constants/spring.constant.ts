/**
 * Stackra file contract:
 * Purpose: `SPRING`, the one spring every springy part plays (a tab or segment indicator, a ticker settling): a CSS
 *          `linear()` curve with its duration for web, and the same feel as Reanimated spring physics for native.
 * Boundary: data only; played only at the `full` motion level.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer).
 */

/** The spring: a light overshoot that settles in about half a second. */
export const SPRING = Object.freeze({
  /** The CSS easing, a sampled spring with a small overshoot. */
  css: "linear(0, 0.25 8%, 0.64 18%, 0.9 27%, 1.04 36%, 1.08 44%, 1.07 51%, 1.03 66%, 1 80%, 1)",
  /** The duration the CSS curve is drawn over, in milliseconds. */
  durationMs: 520,
  /** Reanimated's spring physics for the same feel. */
  native: Object.freeze({ damping: 16, stiffness: 220, mass: 1 }),
});
