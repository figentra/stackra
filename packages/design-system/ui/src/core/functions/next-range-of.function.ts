/**
 * Stackra file contract:
 * Purpose: `nextRangeOf(anchor, day)`, what a press on `day` does to a range being picked: the first press sets the
 *          anchor, the second completes the range in order (a press before the anchor makes it the start).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import type { CalendarDate } from "@internationalized/date";

/**
 * The state after a press.
 * @param anchor - the first day pressed, or `null` when no range is under way
 * @param day - the day pressed
 * @returns the new anchor and, once complete, the range
 */
export function nextRangeOf(
  anchor: CalendarDate | null,
  day: CalendarDate,
): {
  readonly anchor: CalendarDate | null;
  readonly range: { readonly start: CalendarDate; readonly end: CalendarDate } | null;
} {
  if (!anchor) return { anchor: day, range: null };
  const [start, end] = day.compare(anchor) < 0 ? [day, anchor] : [anchor, day];
  return { anchor: null, range: { start, end } };
}
