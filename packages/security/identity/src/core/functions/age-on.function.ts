/**
 * Stackra file contract:
 * Purpose: `ageOn`, a person's age in whole years on a date, from their birth date (`YYYY-MM-DD` both).
 * Boundary: internal and pure; a 29 February birthday counts on 1 March in a common year.
 * Runtime: isomorphic
 * Governing contract: OS-284.
 */

/** A `YYYY-MM-DD` date. */
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The age of someone born on `birthDate`, on `on`.
 *
 * @throws RangeError when a date is not `YYYY-MM-DD`.
 * @example
 * ageOn("2010-10-26", "2026-10-25"); // 15
 */
export function ageOn(birthDate: string, on: string): number {
  const born = DATE.exec(birthDate);
  const day = DATE.exec(on);
  if (born === null || day === null) throw new RangeError("dates are YYYY-MM-DD");
  const [, by, bm, bd] = born.map(Number) as [number, number, number, number];
  const [, y, m, d] = day.map(Number) as [number, number, number, number];
  return y - by - (m > bm || (m === bm && d >= bd) ? 0 : 1);
}
