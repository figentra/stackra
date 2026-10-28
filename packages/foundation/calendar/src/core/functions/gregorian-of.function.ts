/**
 * Stackra file contract:
 * Purpose: `gregorianOf`, the Gregorian date of an Umm al-Qura date: how a Hijri holiday rule or a Hijri date typed by
 *          a user becomes the stored `IsoDate`.
 * Boundary: estimates the day from the mean month and corrects it against `hijriAt` until both agree. A day that the
 *           month does not have (30 of a 29-day month) never agrees and throws a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 2).
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import { dateOfDay } from "#core/functions/date-of-day.function";
import { hijriAt } from "#core/functions/hijri-at.function";
import type { HijriDate } from "#core/types/hijri-date.type";
import type { IsoDate } from "#core/types/iso-date.type";

/** Day number of 1 Muharram 1 AH (19 July 622, proleptic Gregorian). */
const EPOCH = Date.UTC(622, 6, 19) / MS_PER_DAY;

/** The mean synodic month in days. */
const MONTH = 29.530588;

/** Corrections tried before the date is declared not to exist. */
const ATTEMPTS = 8;

/**
 * The Gregorian date of `hijri`.
 *
 * @example
 * gregorianOf({ year: 1447, month: 1, day: 1 }); // "2025-06-26"
 */
export function gregorianOf(hijri: HijriDate): IsoDate {
  const { year, month, day } = hijri;
  if (
    !Number.isInteger(year) ||
    year < 1 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > 30
  )
    throw new RangeError(`Not a Hijri date: ${year}-${month}-${day}`);
  const target = (year - 1) * 12 + month - 1;
  let guess = Math.round(EPOCH + target * MONTH + day - 1);
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const found = hijriAt(guess);
    const months = target - ((found.year - 1) * 12 + found.month - 1);
    const delta = Math.round(months * MONTH) + day - found.day;
    if (months === 0 && delta === 0) return dateOfDay(guess);
    guess += delta === 0 ? Math.sign(months) : delta;
  }
  throw new RangeError(`No such Umm al-Qura date: ${year}-${month}-${day}`);
}
