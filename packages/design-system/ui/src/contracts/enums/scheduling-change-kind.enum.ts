/**
 * Stackra file contract:
 * Purpose: `SchedulingChangeKind`, what a `SchedulingBoard` drag does: selects an empty range, moves an item, or resizes its end.
 * Boundary: the values only; each runtime's SchedulingBoard draws them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */

/** The changes. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128), as SchedulerView.
export const SchedulingChangeKind = Object.freeze(["select", "move", "resize"] as const);

/** One value of `SchedulingChangeKind`. */
export type SchedulingChangeKind = (typeof SchedulingChangeKind)[number];
