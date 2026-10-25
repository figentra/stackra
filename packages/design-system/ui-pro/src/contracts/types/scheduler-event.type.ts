/**
 * Stackra file contract:
 * Purpose: one booking on a `ResourceScheduler`: its id, title, the day and resource it sits on, its start and end in
 *          minutes from midnight, its processing gaps, and whether it may be moved.
 * Boundary: types only. Times are wall-clock minutes of the given day, already in the venue's time zone; the scheduler
 *           does no time-zone arithmetic.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { SchedulerSegment } from "#contracts/types/scheduler-segment.type";

/** A booking. */
export interface SchedulerEvent {
  /** The booking's id. */
  readonly id: string;
  /** What it is (`Cut and colour, Sara`). */
  readonly title: string;
  /** The ISO date it is on. */
  readonly day: string;
  /** The resource it is on. */
  readonly resource: string;
  /** The start, in minutes from midnight. */
  readonly start: number;
  /** The end, in minutes from midnight, after the start. */
  readonly end: number;
  /** Its parts; one busy part over the whole booking when absent. */
  readonly segments?: readonly SchedulerSegment[] | undefined;
  /** False to fix it in place. */
  readonly isMovable?: boolean | undefined;
}
