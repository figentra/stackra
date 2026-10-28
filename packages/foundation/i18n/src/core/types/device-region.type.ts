/**
 * Stackra file contract:
 * Purpose: `DeviceRegion`, the phone's region settings that `regionFormat` reads: its region, measurement system,
 *          clock, first weekday and time zone, separate from its language.
 * Boundary: a type only, the structural subset of expo-localization's `getLocales()[0]` and `getCalendars()[0]`
 *           merged, so an app passes `{ ...getLocales()[0], ...getCalendars()[0] }` and this package depends on no
 *           Expo library. Every field is `null` where the platform does not say.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534), ADR 0403 (formats per locale), ADR 0478 (Expo libraries).
 */

/** The phone's region settings. */
export interface DeviceRegion {
  /** The ISO 3166 region the phone is set to (`"DE"`), separate from its language. */
  readonly regionCode: string | null;

  /** The phone's units: metric, US customary, or UK imperial. */
  readonly measurementSystem: "metric" | "us" | "uk" | null;

  /** Whether the phone shows a 24-hour clock. */
  readonly uses24hourClock: boolean | null;

  /** The phone's first weekday, Gregorian numbering as expo-localization gives it: 1 Sunday to 7 Saturday. */
  readonly firstWeekday: number | null;

  /** The phone's IANA time zone (`"Europe/Berlin"`). */
  readonly timeZone: string | null;
}
