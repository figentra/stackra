/**
 * Stackra file contract:
 * Purpose: `SchedulerView`, the views of a `Scheduler`: one day, one week, one month, or an agenda list of the month.
 * Boundary: the values only; each runtime's Scheduler draws them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (gap build, owner approval 2026-10-31).
 */

/** The views, smallest span first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the views carry no labels.
export const SchedulerView = Object.freeze(["day", "week", "month", "agenda"] as const);

/** One view. */
export type SchedulerView = (typeof SchedulerView)[number];
