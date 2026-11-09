/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardDayMark`, how one day stands in the node's calendar (working, rest day, holiday or
 *          uncertain) and an optional label (a holiday's name or a Hijri date), for the SchedulingBoard's header.
 * Boundary: types only; the calendar is the caller's (the engine's `calendar_day.list`).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { CalendarDate } from "@internationalized/date";

import type { SchedulingDayStatus } from "#contracts/enums/scheduling-day-status.enum";

/** One day's standing. */
export interface SchedulingBoardDayMark {
  /** The day. */
  readonly date: CalendarDate;
  /** How it stands; a rest day or holiday is shaded. */
  readonly status: SchedulingDayStatus;
  /** Words under the date, for example "National Day". */
  readonly label?: string | undefined;
}
