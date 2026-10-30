/**
 * Stackra file contract:
 * Purpose: The states a MorphButton morphs between: ready, working, done and failed.
 * Boundary: the values only; each runtime maps them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile interactions (owner
 *          approval 2026-10-28).
 */

/** The states a MorphButton morphs between: ready, working, done and failed. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the values carry no labels.
export const MorphButtonState = Object.freeze(["idle", "loading", "success", "error"] as const);

/** One value of `MorphButtonState`. */
export type MorphButtonState = (typeof MorphButtonState)[number];
