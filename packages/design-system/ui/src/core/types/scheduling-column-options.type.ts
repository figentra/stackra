/**
 * Stackra file contract:
 * Purpose: `SchedulingColumnOptions`, what `schedulingColumnsOf` needs besides the view and the day: the time zone,
 *          the slot length, the hours shown, the timeline's length and the locale (its first weekday).
 * Boundary: types only; internal to the web and native SchedulingBoard.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */

/** How the columns are cut. */
export interface SchedulingColumnOptions {
  /** The IANA time zone the days are read in. */
  readonly timeZone: string;
  /** Minutes per slot. */
  readonly slotMinutes: number;
  /** The first hour shown. */
  readonly startHour: number;
  /** The hour shown up to. */
  readonly endHour: number;
  /** The timeline view's days. */
  readonly timelineDays: number;
  /** A BCP 47 tag; it decides the first day of the week. */
  readonly locale: string;
}
