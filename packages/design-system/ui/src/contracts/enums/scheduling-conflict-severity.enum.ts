/**
 * Stackra file contract:
 * Purpose: `SchedulingConflictSeverity`, how much a conflict of a `SchedulingBoard` drag weighs: `block`, shown red, which the screen
 *          is expected to refuse, or `warn`, shown amber, which it may ask to confirm.
 * Boundary: the values only; each runtime's SchedulingBoard draws them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */

/** The severities, heaviest first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128), as SchedulerView.
export const SchedulingConflictSeverity = Object.freeze(["block", "warn"] as const);

/** One value of `SchedulingConflictSeverity`. */
export type SchedulingConflictSeverity = (typeof SchedulingConflictSeverity)[number];
