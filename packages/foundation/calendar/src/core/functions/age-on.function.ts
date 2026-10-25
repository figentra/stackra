/**
 * Stackra file contract:
 * Purpose: `ageOn`, a person's age in whole years on a date: age-group cut-offs, consent ages and eligibility windows.
 * Boundary: pure. The day a 29 February birthday counts in a common year is the market's law, passed in as
 *           `LeapBirthday` from pack data. Throws a `RangeError` when `on` is before `birth`.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 8); ADR 0363 (decision 4: legal rules are pack data).
 */
import { LeapBirthday } from "#core/enums/leap-birthday.enum";
import { dayNumber } from "#core/functions/day-number.function";
import type { IsoDate } from "#core/types/iso-date.type";

/**
 * Whole years from `birth` to `on`.
 *
 * @example
 * ageOn("2010-02-28", "2026-02-27", LeapBirthday.March1); // 15
 */
export function ageOn(birth: IsoDate, on: IsoDate, leapBirthday: LeapBirthday): number {
  if (dayNumber(on) < dayNumber(birth))
    throw new RangeError(`${on} is before the birth date ${birth}`);
  const [birthYear, birthMonth, birthDay] = birth.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const [year, month, day] = on.split("-").map(Number) as [number, number, number];
  const leapYear = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;
  let [dueMonth, dueDay] = [birthMonth, birthDay];
  if (birthMonth === 2 && birthDay === 29 && !leapYear)
    [dueMonth, dueDay] = leapBirthday === LeapBirthday.February28 ? [2, 28] : [3, 1];
  const before = month < dueMonth || (month === dueMonth && day < dueDay);
  return year - birthYear - (before ? 1 : 0);
}
