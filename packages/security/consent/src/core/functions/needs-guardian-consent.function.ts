/**
 * Stackra file contract:
 * Purpose: `needsGuardianConsent`, whether a person born on a date is below an age of consent on another date, so a
 *          guardian must consent for them.
 * Boundary: pure; the age of consent is the caller's value from the market pack (a legal floor) or a stricter setting,
 *           never a number here. Dates are `YYYY-MM-DD`; a birthday on 29 February counts on 1 March in common years.
 * Runtime: isomorphic
 * Governing contract: OS-284; ADR 0370 (legal floors are pack data); ADR 0363.
 */

/** A `YYYY-MM-DD` date. */
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The year, month and day of `date`. */
function partsOf(date: string): [number, number, number] {
  const match = DATE.exec(date);
  if (match === null) throw new RangeError(`${date} is not a YYYY-MM-DD date`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Whether someone born on `birthDate` is younger than `ageOfConsent` on `on`.
 *
 * @throws RangeError when a date is not `YYYY-MM-DD` or the age is not a whole number of zero or more.
 * @example
 * needsGuardianConsent("2012-05-01", "2026-10-25", ageOfConsent); // ageOfConsent from valueOf(pack, key, on)
 */
export function needsGuardianConsent(birthDate: string, on: string, ageOfConsent: number): boolean {
  if (!Number.isInteger(ageOfConsent) || ageOfConsent < 0)
    throw new RangeError(`the age of consent must be a whole number, got ${ageOfConsent}`);
  const [birthYear, birthMonth, birthDay] = partsOf(birthDate);
  const [year, month, day] = partsOf(on);
  const hadBirthday = month > birthMonth || (month === birthMonth && day >= birthDay);
  return year - birthYear - (hadBirthday ? 0 : 1) < ageOfConsent;
}
