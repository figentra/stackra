/**
 * Stackra file contract:
 * Purpose: `ageOn`, a person's age in whole years on a date (`YYYY-MM-DD` both): age-group cut-offs, consent ages,
 *          guardian checks and eligibility windows.
 * Boundary: public and pure. The day a 29 February birthday counts in a common year is the market's law, passed in
 *           from pack data (`february_28` or `march_1`, the values of @stackra/calendar's `LeapBirthday`); there is no
 *           default. Throws a `RangeError` when a date is not `YYYY-MM-DD` or `on` is before `birth`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); ADR 0366 (decision 8); ADR 0363 (decision 4: legal rules
 *                     are pack data); stackra-224 (one copy with calendar's leap-day rule, was calendar and identity).
 */

/** A `YYYY-MM-DD` date. */
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The year, month and day of `date`. */
function partsOf(date: string): [number, number, number] {
  const match = DATE.exec(date);
  if (match === null) throw new RangeError(`${date} is not YYYY-MM-DD`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Whole years from `birth` to `on`.
 *
 * @throws RangeError when a date is not `YYYY-MM-DD`, or `on` is before `birth`.
 * @example
 * ageOn("2010-02-28", "2026-02-27", "march_1"); // 15
 * ageOn("2008-02-29", "2026-02-28", "february_28"); // 18
 * ageOn("2008-02-29", "2026-02-28", "march_1"); // 17
 */
export function ageOn(birth: string, on: string, leapBirthday: "february_28" | "march_1"): number {
  const [birthYear, birthMonth, birthDay] = partsOf(birth);
  const [year, month, day] = partsOf(on);
  // ISO dates of four-digit years order as text.
  if (on < birth) throw new RangeError(`${on} is before the birth date ${birth}`);
  const leapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  let [dueMonth, dueDay] = [birthMonth, birthDay];
  if (birthMonth === 2 && birthDay === 29 && !leapYear)
    [dueMonth, dueDay] = leapBirthday === "february_28" ? [2, 28] : [3, 1];
  const before = month < dueMonth || (month === dueMonth && day < dueDay);
  return year - birthYear - (before ? 1 : 0);
}
