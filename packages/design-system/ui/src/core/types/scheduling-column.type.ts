/**
 * Stackra file contract:
 * Purpose: `SchedulingColumn`, one column of a SchedulingBoard as `schedulingColumnsOf` lays it out: a slot of a
 *          day (day and week views) or a whole day (timeline), with its day and whether it opens that day.
 * Boundary: types only; internal to the web and native SchedulingBoard.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { CalendarDate } from "@internationalized/date";

/** One column of the board. */
export interface SchedulingColumn {
  /** When it starts. */
  readonly start: Date;
  /** When it ends; the next column may start later (the hours not shown). */
  readonly end: Date;
  /** The day it belongs to, in the board's time zone. */
  readonly day: CalendarDate;
  /** True for the first column of its day, where the day's header and border go. */
  readonly opensDay: boolean;
}
