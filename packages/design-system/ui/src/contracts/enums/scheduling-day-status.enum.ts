/**
 * Stackra file contract:
 * Purpose: `SchedulingDayStatus`, how a day stands in a node's calendar, for a `SchedulingBoard`'s header: a working day, a rest
 *          day, a holiday, or uncertain (a Hijri holiday whose date waits on the moon sighting).
 * Boundary: the values only; each runtime's SchedulingBoard draws them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */

/** The statuses, the engine's words. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128), as SchedulerView.
export const SchedulingDayStatus = Object.freeze([
  "working",
  "rest_day",
  "holiday",
  "uncertain",
] as const);

/** One value of `SchedulingDayStatus`. */
export type SchedulingDayStatus = (typeof SchedulingDayStatus)[number];
