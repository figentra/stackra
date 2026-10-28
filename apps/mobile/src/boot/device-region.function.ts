/**
 * Stackra file contract:
 * Purpose: `deviceRegion()`, the phone's region settings, read from expo-localization in the shape @stackra/i18n's
 *          `regionFormat` takes.
 * Boundary: reads only; called at launch and on each return to the foreground, so a change in the phone's Settings
 *           applies without a restart. A field the platform leaves out reads `null`.
 * Runtime: react-native
 * Governing contract: ADR 0080 (2026-10-29 note); ADR 0478 (Expo libraries); ADR 0007 (documentation).
 */
import type { DeviceRegion } from "@stackra/i18n";
import { getCalendars, getLocales } from "expo-localization";

/**
 * The phone's region, units, clock, first weekday and time zone.
 *
 * @example
 * regionFormat(deviceRegion(), localeFormat(locale));
 */
export function deviceRegion(): DeviceRegion {
  const [language] = getLocales();
  const [calendar] = getCalendars();
  return {
    regionCode: language?.regionCode ?? null,
    measurementSystem: language?.measurementSystem ?? null,
    uses24hourClock: calendar?.uses24hourClock ?? null,
    firstWeekday: calendar?.firstWeekday ?? null,
    timeZone: calendar?.timeZone ?? null,
  };
}
