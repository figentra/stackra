/**
 * Stackra file contract:
 * Purpose: `schedulingSnapOf(at, slotMinutes, timeZone)`, a moment rounded to the nearest slot boundary of its day in
 *          the board's time zone: every drag on a SchedulingBoard lands on a slot.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); shared modules step 4a (LEADER, 2026-11-09).
 */
import { fromDate, toCalendarDate } from "@internationalized/date";

/** A minute in milliseconds. */
const MINUTE = 60_000;

/**
 * The nearest slot boundary.
 * @param at - the moment
 * @param slotMinutes - minutes per slot
 * @param timeZone - the board's IANA time zone
 * @returns the boundary
 * @example
 * schedulingSnapOf(new Date("2026-11-09T09:08:00Z"), 15, "UTC"); // 09:15
 */
export function schedulingSnapOf(at: Date, slotMinutes: number, timeZone: string): Date {
  // shortcut: counted from local midnight, as schedulingColumnsOf; a daylight-saving day is off by its shift.
  const midnight = toCalendarDate(fromDate(at, timeZone)).toDate(timeZone).getTime();
  const step = slotMinutes * MINUTE;
  return new Date(midnight + Math.round((at.getTime() - midnight) / step) * step);
}
