/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/calendar (the day-count mode of a deadline, the pack
 *          calendar reference, the business-day boundary and the Hijri schedule), until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing; every file here is a leaf and imports nothing from `core`. The
 *           names here are new; the types already exported from `.` stay there (no symbol from two entries, ADR 0294).
 * Runtime: isomorphic
 * Governing contract: ADR 0117 (decision 2); ADR 0294 (decision 15); ADR 0366; ADR 0387.
 */
export { DayCountMode } from "#contracts/enums/day-count-mode.enum";
export type { BusinessDayBoundary } from "#contracts/types/business-day-boundary.type";
export type { HijriSchedule } from "#contracts/types/hijri-schedule.type";
export type { PackCalendarRef } from "#contracts/types/pack-calendar-ref.type";
