/**
 * Stackra file contract:
 * Purpose: `SchedulingResourceKind`, what a row of a `SchedulingBoard` is: a person, a room or space, a piece of equipment, or a
 *          delivery slot.
 * Boundary: the values only; each runtime's SchedulingBoard draws them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */

/** The kinds, the engine's words. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128), as SchedulerView.
export const SchedulingResourceKind = Object.freeze([
  "person",
  "room",
  "equipment",
  "delivery_slot",
] as const);

/** One value of `SchedulingResourceKind`. */
export type SchedulingResourceKind = (typeof SchedulingResourceKind)[number];
