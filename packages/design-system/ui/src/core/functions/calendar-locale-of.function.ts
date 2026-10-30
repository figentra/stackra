/**
 * Stackra file contract:
 * Purpose: `calendarLocaleOf(locale, calendar)`, the locale tag that makes React Aria and Intl show dates in
 *          `calendar`: the tag itself for Gregorian, else the tag with a `-u-ca-` keyword (kept beside a `-nu-` one).
 * Boundary: pure; the value of a picker stays Gregorian, only its display changes.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (Hijri option, owner approval 2026-10-28); ADR 0060.
 */
import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";

/**
 * The locale tag that shows dates in `calendar`.
 * @param locale - a BCP 47 tag, perhaps with a `-u-` extension
 * @param calendar - the calendar system
 * @returns the tag with the calendar keyword, or the tag as is for Gregorian
 */
export function calendarLocaleOf(locale: string, calendar: CalendarSystem = "gregory"): string {
  if (calendar === "gregory") return locale;
  const bare = locale.replace(/-ca-[a-z0-9-]+?(?=-[a-z0-9]{2}-|$)/i, "");
  return bare.includes("-u-")
    ? bare.replace("-u-", `-u-ca-${calendar}-`)
    : `${bare}-u-ca-${calendar}`;
}
