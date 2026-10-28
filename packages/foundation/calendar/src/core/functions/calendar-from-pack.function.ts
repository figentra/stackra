/**
 * Stackra file contract:
 * Purpose: `calendarFromPack`, the `BusinessCalendar` a resolved market pack gives on a date: its time zone, working
 *          week and uncertain-day rule, and every holiday set under `calendar.holidays.` (the `us` federal set and a
 *          state's own set both show through an overlay), with the location's own data laid over it.
 * Boundary: pure over a `ResolvedPack` of `@stackra/market-packs`. Pack keys: `calendar.time_zone`,
 *           `calendar.working_week`, `calendar.holidays.<set>` (a list of holiday rules each), and
 *           `calendar.uncertain_days`. Holiday sets are joined in key order, then the local ones. The result is checked
 *           by `BusinessCalendar$`, so a missing or malformed value throws its `ZodError` instead of a guess.
 * Runtime: isomorphic
 * Governing contract: ADR 0387 (calendar from packs; amends ADR 0366 decisions 3 and 9); ADR 0370 (decision 5).
 */
import type { ResolvedPack } from "@stackra/market-packs";
import { valuesOn } from "@stackra/market-packs";

import { BUSINESS_CALENDAR_SCHEMA } from "#core/constants/business-calendar-schema.constant";
import type { BusinessCalendar } from "#core/types/business-calendar.type";
import type { IsoDate } from "#core/types/iso-date.type";
import type { PackCalendarOptions } from "#core/types/pack-calendar-options.type";

/** The prefix of the holiday-set keys. */
const HOLIDAYS = "calendar.holidays.";

/**
 * The calendar of `resolved` on `on`, with `local` laid over it.
 *
 * @example
 * const calendar = calendarFromPack(context.packFor(sale, "calendar"), today, { timeZone: location.timeZone });
 * addBusinessDays(calendar, today, 3);
 */
export function calendarFromPack(
  resolved: ResolvedPack,
  on: IsoDate,
  local: PackCalendarOptions = {},
): BusinessCalendar {
  const values = valuesOn(resolved, on);
  const holidays = [...values]
    .filter(([key]) => key.startsWith(HOLIDAYS))
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .flatMap(([, item]) => item.value);
  return BUSINESS_CALENDAR_SCHEMA.parse({
    timeZone: local.timeZone ?? values.get("calendar.time_zone")?.value,
    workingWeek: local.workingWeek ?? values.get("calendar.working_week")?.value,
    holidays: [...holidays, ...(local.holidays ?? [])],
    uncertainDays: values.get("calendar.uncertain_days")?.value,
  });
}
