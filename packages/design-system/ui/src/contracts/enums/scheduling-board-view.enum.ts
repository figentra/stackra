/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardView`, the views of a `SchedulingBoard`: one day or one week with a column per slot, or a timeline
 *          with a column per day for multi-day closures and leave.
 * Boundary: the values only; each runtime's SchedulingBoard draws them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */

/** The views, smallest span first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128), as SchedulerView.
export const SchedulingBoardView = Object.freeze(["day", "week", "timeline"] as const);

/** One value of `SchedulingBoardView`. */
export type SchedulingBoardView = (typeof SchedulingBoardView)[number];
