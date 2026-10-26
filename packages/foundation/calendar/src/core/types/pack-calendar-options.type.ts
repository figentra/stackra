/**
 * Stackra file contract:
 * Purpose: `PackCalendarOptions`, what a location, tenant, branch or court lays over the market pack's calendar in
 *          `calendarFromPack`: its own time zone, its own working week and its extra closures.
 * Boundary: a type only. Each field is optional; a field given replaces the pack's (`timeZone`, `workingWeek`) or adds
 *           to it (`holidays`). The values are settings and records, never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0387 (calendar from packs); ADR 0366 (decision 3).
 */
import type { BusinessCalendar } from "#core/types/business-calendar.type";
import type { HolidayRule } from "#core/types/holiday-rule.type";

/** Local calendar data laid over the pack's. */
export type PackCalendarOptions = {
  /** The location's IANA time zone; the pack's `calendar.time_zone` when left out. */
  readonly timeZone?: string;
  /** The location's working week; the pack's `calendar.working_week` when left out. */
  readonly workingWeek?: BusinessCalendar["workingWeek"];
  /** Closures and recesses added to the pack's holiday sets. */
  readonly holidays?: readonly HolidayRule[];
};
