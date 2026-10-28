/**
 * Stackra file contract:
 * Purpose: `regionFormat(device, base, override)`, a native app's region formats: the phone's region, units, clock,
 *          first weekday and time zone over the active locale's own (`localeFormat`), then the account's override
 *          (business documents) or the app's declared zone (shifts, bookings, reports).
 * Boundary: a pure function. The phone's first weekday arrives in Gregorian numbering (1 Sunday) and leaves in ISO
 *           8601 (7 Sunday), as `LocaleFormat` holds it. A field the phone leaves `null` keeps the locale's value.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534), ADR 0403 (formats per locale).
 */
import { HourCycle } from "#core/enums/hour-cycle.enum";
import type { DeviceRegion } from "#core/types/device-region.type";
import type { LocaleFormat } from "#core/types/locale-format.type";
import type { RegionFormat } from "#core/types/region-format.type";

/**
 * The region formats of a native app.
 *
 * @example
 * const device = deviceRegion(); // @stackra/i18n/native
 * regionFormat(device, localeFormat(Locale.En)); // { region: "DE", hourCycle: "h23", weekStart: 1, ... }
 * regionFormat(device, localeFormat(Locale.En), { timeZone: business.timeZone });
 */
export function regionFormat(
  device: DeviceRegion,
  base: LocaleFormat,
  override: Partial<RegionFormat> = {},
): RegionFormat {
  const { firstWeekday, uses24hourClock } = device;
  return {
    region: device.regionCode,
    measurementSystem: device.measurementSystem ?? "metric",
    timeZone: device.timeZone,
    weekStart: firstWeekday === null ? base.weekStart : ((firstWeekday + 5) % 7) + 1,
    hourCycle:
      uses24hourClock === null ? base.hourCycle : uses24hourClock ? HourCycle.H23 : HourCycle.H12,
    ...override,
  };
}
