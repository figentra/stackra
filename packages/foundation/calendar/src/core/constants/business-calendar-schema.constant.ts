/**
 * Stackra file contract:
 * Purpose: `BUSINESS_CALENDAR_SCHEMA`, the zod schema of `BusinessCalendar` (its `X$`): the check a market-pack loader
 *          or a settings form runs on calendar data before any function here reads it.
 * Boundary: shape only, no values: the time zone must be one the runtime knows, each weekday appears at most once with
 *           at least one span of hours, and a holiday rule is dated, yearly Gregorian or yearly Hijri. A span whose end
 *           is not after its start ends on the next day (night hours). `days` defaults to 1.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 3: calendar data from market packs); ADR 0363 (decisions 3 and 9).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { HolidayKind } from "#core/enums/holiday-kind.enum";
import { UncertainDays } from "#core/enums/uncertain-days.enum";

/** A wall-clock time `HH:mm`. */
const TIME = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:mm");

/** The length of a holiday in days. */
const DAYS = z.int().min(1).default(1);

/** `true` when the runtime knows `zone`. */
function knownZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/** The shipped `BusinessCalendar$`. */
export const BUSINESS_CALENDAR_SCHEMA = z.object({
  timeZone: z.string().refine(knownZone, "Not a time zone this runtime knows"),
  workingWeek: z
    .array(
      z.object({
        day: z.int().min(1).max(7),
        hours: z.array(z.object({ start: TIME, end: TIME })).min(1),
      }),
    )
    .refine(
      (week) => new Set(week.map((entry) => entry.day)).size === week.length,
      "A weekday appears once",
    ),
  holidays: z.array(
    z.discriminatedUnion("kind", [
      z.object({
        kind: z.literal(HolidayKind.Dated),
        key: z.string().min(1),
        date: z.iso.date(),
        days: DAYS,
      }),
      z.object({
        kind: z.literal(HolidayKind.Gregorian),
        key: z.string().min(1),
        month: z.int().min(1).max(12),
        day: z.int().min(1).max(31),
        days: DAYS,
        since: z.iso.date().exactOptional(),
        until: z.iso.date().exactOptional(),
      }),
      z.object({
        kind: z.literal(HolidayKind.Hijri),
        key: z.string().min(1),
        month: z.int().min(1).max(12),
        day: z.int().min(1).max(30),
        days: DAYS,
        sighted: z.boolean(),
        since: z.iso.date().exactOptional(),
        until: z.iso.date().exactOptional(),
      }),
    ]),
  ),
  uncertainDays: z.enum(Enum.values(UncertainDays)),
});
