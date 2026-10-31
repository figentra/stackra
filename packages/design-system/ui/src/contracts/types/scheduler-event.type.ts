/**
 * Stackra file contract:
 * Purpose: `SchedulerEvent`, one event a `Scheduler` places: its key, title, start and end instants, whether it is all
 *          day, and its tone.
 * Boundary: types only; the instants are absolute, and the Scheduler reads them in its `timeZone`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { Tone } from "@stackra/contracts";

/** One event on the schedule. */
export interface SchedulerEvent {
  /** Unique among the events; React keys the event by it. */
  readonly id: string;
  /** The words on the event, also its accessible name with its time. */
  readonly title: string;
  /** When it starts. */
  readonly start: Date;
  /** When it ends; after `start`. */
  readonly end: Date;
  /** True to show it in the all-day row instead of the hours. */
  readonly isAllDay?: boolean | undefined;
  /** The event's colour; `accent` by default. */
  readonly tone?: Tone | undefined;
}
