/**
 * Stackra file contract:
 * Purpose: `SchedulingItemKind`, what a block on a `SchedulingBoard` is: a booking, a hold awaiting payment, a closure, a block
 *          (a staff block or a synced busy time), or working time, drawn as a band behind the lane.
 * Boundary: the values only; each runtime's SchedulingBoard draws them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */

/** The kinds, the engine's words. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128), as SchedulerView.
export const SchedulingItemKind = Object.freeze([
  "booking",
  "hold",
  "closure",
  "block",
  "working_time",
] as const);

/** One value of `SchedulingItemKind`. */
export type SchedulingItemKind = (typeof SchedulingItemKind)[number];
