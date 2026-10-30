/**
 * Stackra file contract:
 * Purpose: how a `CoachMark` tour ended: `done` after its last step, or `skipped` by Skip, Escape or the Android
 *          back button before it.
 * Boundary: the values only; the app records the outcome so a finished or skipped tour is not shown again.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 39 (owner decision 2026-10-28).
 */

/** The ways a coach mark tour can end. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the outcomes carry no labels.
export const CoachMarkOutcome = Object.freeze(["done", "skipped"] as const);

/** How one coach mark tour ended. */
export type CoachMarkOutcome = (typeof CoachMarkOutcome)[number];
