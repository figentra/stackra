/**
 * Stackra file contract:
 * Purpose: `computePrayerDay`, the astronomical prayer times of one date at one place under one method: Dhuhr at solar
 *          noon, sunrise and Maghrib from the sun at the horizon (refraction and elevation included), Asr from the
 *          shadow factor, Fajr and Isha from their angles (or Isha as minutes after Maghrib), with the method's
 *          high-latitude rule where an angle is never reached.
 * Boundary: internal to the package; pure arithmetic, no clock and no table. The sun's position uses the U.S. Naval
 *           Observatory's low-precision formulas (about one minute of accuracy between 1800 and 2200), evaluated once
 *           per time at the time's estimate. Times are UTC hours from the date's UTC midnight, so no time zone is
 *           needed. Refuses with a RangeError a day with no sunrise or no answer for an angle under rule `none`.
 * Runtime: isomorphic
 * Governing contract: ADR 0414 (decision 2); USNO "Approximate Solar Coordinates"; the praytimes.org method.
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import { HighLatitudeRule } from "#core/enums/high-latitude-rule.enum";
import { dayNumber } from "#core/functions/day-number.function";
import type { IsoDate } from "#core/types/iso-date.type";
import type { PrayerDay } from "#core/types/prayer-day.type";
import type { PrayerMethod } from "#core/types/prayer-method.type";
import type { PrayerPlace } from "#core/types/prayer-place.type";

const RAD = Math.PI / 180;

const sin = (degrees: number) => Math.sin(degrees * RAD);
const cos = (degrees: number) => Math.cos(degrees * RAD);
const tan = (degrees: number) => Math.tan(degrees * RAD);
const asin = (value: number) => Math.asin(value) / RAD;
const acos = (value: number) => Math.acos(value) / RAD;
const atan2 = (y: number, x: number) => Math.atan2(y, x) / RAD;
const wrap = (value: number, range: number) => value - range * Math.floor(value / range);

/** The Julian date of the date's UTC midnight: day number 0 is 1970-01-01, Julian date 2440587.5. */
const julianOf = (day: number) => day + 2_440_587.5;

/** The sun's declination (degrees) and the equation of time (hours) at Julian date `jd`. */
function sun(jd: number): { readonly declination: number; readonly equation: number } {
  const d = jd - 2_451_545;
  const g = wrap(357.529 + 0.98560028 * d, 360);
  const q = wrap(280.459 + 0.98564736 * d, 360);
  const l = wrap(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360);
  const e = 23.439 - 0.00000036 * d;
  const ra = wrap(atan2(cos(e) * sin(l), cos(l)) / 15, 24);
  return { declination: asin(sin(e) * sin(l)), equation: q / 15 - ra };
}

/**
 * The prayer times of `date` at `place` under `method`.
 *
 * @throws RangeError when the date or place is invalid, or the day has no time for a prayer under the method.
 */
export function computePrayerDay(
  date: IsoDate,
  place: PrayerPlace,
  method: PrayerMethod,
): PrayerDay {
  const { latitude, longitude } = place;
  const elevation = place.elevation ?? 0;
  if (!(Math.abs(latitude) <= 90) || !(Math.abs(longitude) <= 180) || !(elevation >= 0))
    throw new RangeError(
      "A place has a latitude within ±90°, a longitude within ±180° and no negative elevation",
    );
  const day = dayNumber(date);
  // Local solar times below are hours from local mean midnight; the sun is sampled at the matching instant.
  const jd = julianOf(day) - longitude / 360;
  const noon = (hour: number) => wrap(12 - sun(jd + hour / 24).equation, 24);
  const atAngle = (angle: number, hour: number, before: boolean) => {
    const { declination } = sun(jd + hour / 24);
    const span =
      acos((-sin(angle) - sin(declination) * sin(latitude)) / (cos(declination) * cos(latitude))) /
      15;
    return noon(hour) + (before ? -span : span);
  };
  const horizon = 0.833 + 0.0347 * Math.sqrt(elevation);
  const sunrise = atAngle(horizon, 6, true);
  const sunset = atAngle(horizon, 18, false);
  if (Number.isNaN(sunrise) || Number.isNaN(sunset))
    throw new RangeError(`The sun does not rise and set at ${latitude}° on ${date}`);
  const dhuhr = noon(12);
  const { declination } = sun(jd + 13 / 24);
  const asrAngle = -atan2(1, method.asrFactor + tan(Math.abs(latitude - declination)));
  const asr = atAngle(asrAngle, 13, false);
  const maghrib = sunset + method.maghribMinutes / 60;
  const night = 24 - (sunset - sunrise);
  const portion = (angle: number) =>
    method.highLatitude === HighLatitudeRule.AngleBased
      ? (angle / 60) * night
      : method.highLatitude === HighLatitudeRule.MiddleOfNight
        ? night / 2
        : night / 7;
  let fajr = atAngle(method.fajrAngle, 5, true);
  let isha =
    method.ishaAngle === undefined
      ? maghrib + (method.ishaMinutes ?? 0) / 60
      : atAngle(method.ishaAngle, 18, false);
  if (method.highLatitude !== HighLatitudeRule.None) {
    const fajrLimit = portion(method.fajrAngle);
    if (Number.isNaN(fajr) || sunrise - fajr > fajrLimit) fajr = sunrise - fajrLimit;
    if (method.ishaAngle !== undefined) {
      const ishaLimit = portion(method.ishaAngle);
      if (Number.isNaN(isha) || isha - sunset > ishaLimit) isha = sunset + ishaLimit;
    }
  }
  if (Number.isNaN(fajr) || Number.isNaN(isha))
    throw new RangeError(
      `The sun does not reach the Fajr or Isha angle at ${latitude}° on ${date}`,
    );
  const at = (hour: number) => {
    const ms = day * MS_PER_DAY + (hour - longitude / 15) * 3_600_000;
    return new Date(Math.round(ms / 60_000) * 60_000).toISOString();
  };
  return Object.freeze({
    date,
    fajr: at(fajr),
    sunrise: at(sunrise),
    dhuhr: at(dhuhr),
    asr: at(asr),
    maghrib: at(maghrib),
    isha: at(isha),
  });
}
