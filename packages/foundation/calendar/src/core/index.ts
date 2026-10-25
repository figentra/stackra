/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/calendar, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The day-number, time-zone, RRULE and range helpers stay
 *           internal; consumers use the functions below. The schema is re-exported under its generated name
 *           (`BusinessCalendar$`).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0366.
 */
export { BUSINESS_CALENDAR_SCHEMA as BusinessCalendar$ } from "#core/constants/business-calendar-schema.constant";
export { DayStatus } from "#core/enums/day-status.enum";
export { HolidayKind } from "#core/enums/holiday-kind.enum";
export { LeapBirthday } from "#core/enums/leap-birthday.enum";
export { UncertainDays } from "#core/enums/uncertain-days.enum";
export { addBusinessDays } from "#core/functions/add-business-days.function";
export { addWorkingMinutes } from "#core/functions/add-working-minutes.function";
export { ageOn } from "#core/functions/age-on.function";
export { dayStatus } from "#core/functions/day-status.function";
export { findSlots } from "#core/functions/find-slots.function";
export { gregorianOf } from "#core/functions/gregorian-of.function";
export { hijriOf } from "#core/functions/hijri-of.function";
export { instantOf } from "#core/functions/instant-of.function";
export { localDateOf } from "#core/functions/local-date-of.function";
export { occurrences } from "#core/functions/occurrences.function";
export { openIntervals } from "#core/functions/open-intervals.function";
export type { BusinessCalendar } from "#core/types/business-calendar.type";
export type { BusinessDayResult } from "#core/types/business-day-result.type";
export type { HijriDate } from "#core/types/hijri-date.type";
export type { HolidayRule } from "#core/types/holiday-rule.type";
export type { Interval } from "#core/types/interval.type";
export type { IsoDate } from "#core/types/iso-date.type";
export type { Occurrence } from "#core/types/occurrence.type";
export type { RecurrenceOptions } from "#core/types/recurrence-options.type";
export type { Segment } from "#core/types/segment.type";
export type { SlotQuery } from "#core/types/slot-query.type";
