/**
 * Stackra file contract:
 * Purpose: `PlacedEvent`, one timed event as `dayLayoutOf` places it in a day column: its top and height as shares of
 *          the column, and its lane among the events it overlaps.
 * Boundary: types only; internal to the web and native Scheduler.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";

/** An event placed in a day column. */
export interface PlacedEvent {
  /** The event. */
  readonly event: SchedulerEvent;
  /** Where it starts, as a share (0 to 1) of the column from its top. */
  readonly top: number;
  /** How long it lasts, as a share of the column. */
  readonly height: number;
  /** Its lane, from the reading start, among the events it overlaps. */
  readonly lane: number;
  /** How many lanes its overlapping group needs. */
  readonly lanes: number;
}
