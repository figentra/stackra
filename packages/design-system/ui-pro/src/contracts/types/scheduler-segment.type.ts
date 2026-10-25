/**
 * Stackra file contract:
 * Purpose: one part of a scheduled event: busy time, or a processing gap (a colour developing) when the resource is
 *          free for another booking.
 * Boundary: types only; offsets are minutes from the event's start.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */

/** A part of an event. */
export interface SchedulerSegment {
  /** Minutes from the event's start. */
  readonly offset: number;
  /** Its length in minutes. */
  readonly duration: number;
  /** Whether the resource is free during it. */
  readonly kind: "busy" | "processing";
}
