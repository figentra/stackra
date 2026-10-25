/**
 * Stackra file contract:
 * Purpose: `isOpen`, whether a day status counts as a working day under the calendar's `uncertainDays` data.
 * Boundary: internal; shared by business-day counting and working hours so both treat an uncertain day alike.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 4).
 */
import { DayStatus } from "#core/enums/day-status.enum";
import { UncertainDays } from "#core/enums/uncertain-days.enum";
import type { BusinessCalendar } from "#core/types/business-calendar.type";

/**
 * `true` when a day of `status` is worked under `calendar`.
 *
 * @example
 * isOpen(calendar, "uncertain"); // true when calendar.uncertainDays is "working"
 */
export function isOpen(calendar: BusinessCalendar, status: DayStatus): boolean {
  return (
    status === DayStatus.Working ||
    (status === DayStatus.Uncertain && calendar.uncertainDays === UncertainDays.Working)
  );
}
