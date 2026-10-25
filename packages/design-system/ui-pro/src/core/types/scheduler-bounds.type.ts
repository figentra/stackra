/**
 * Stackra file contract:
 * Purpose: `SchedulerBounds`, the visible hours and the snap step a move or a resize keeps to.
 * Boundary: internal type; the `ResourceScheduler` passes its own props.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */

/** The hours and the step. */
export interface SchedulerBounds {
  /** The first minute shown. */
  readonly startMinute: number;
  /** The last minute shown. */
  readonly endMinute: number;
  /** The snap step, in minutes. */
  readonly slotMinutes: number;
}
