/**
 * Stackra file contract:
 * Purpose: `deviceRegion()`, the phone's region settings (`DeviceRegion`) read from expo-localization, what
 *          `regionFormat` takes as its first argument.
 * Boundary: reads expo-localization's first locale (region, units) and first calendar (clock, first weekday, time
 *           zone); a field the phone does not report is `null`. The readers are parameters so a test hands fakes in.
 * Runtime: react-native
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534), ADR 0478 (Expo libraries).
 */
import { getCalendars, getLocales } from "expo-localization";

import type { DeviceRegion } from "#core/types/device-region.type";

/**
 * The phone's region settings.
 *
 * @example
 * const region = regionFormat(deviceRegion(), localeFormat(locale), { timeZone: business.timeZone });
 */
export function deviceRegion(
  readLocales: typeof getLocales = getLocales,
  readCalendars: typeof getCalendars = getCalendars,
): DeviceRegion {
  const [locale] = readLocales();
  const [calendar] = readCalendars();
  return {
    regionCode: locale?.regionCode ?? null,
    measurementSystem: locale?.measurementSystem ?? null,
    uses24hourClock: calendar?.uses24hourClock ?? null,
    firstWeekday: calendar?.firstWeekday ?? null,
    timeZone: calendar?.timeZone ?? null,
  };
}
