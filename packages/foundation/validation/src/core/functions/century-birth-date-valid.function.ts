/**
 * Stackra file contract:
 * Purpose: `centuryBirthDateValid(digits)`, the structure check of an identifier that opens with a century digit
 *          (`2` for the 1900s, `3` for the 2000s) and a real `YYMMDD` birth date (the Egyptian national ID).
 * Boundary: pure; reads the first seven digits only. A date in the future is not refused here: the format's pattern
 *           and the caller's own clock decide that. Internal to `checkIdentifier`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305; round 3 #36.
 */

/**
 * Whether `digits` opens with a century digit and a real date.
 *
 * @example
 * centuryBirthDateValid("29001011234567"); // true (1990-01-01)
 */
export function centuryBirthDateValid(digits: string): boolean {
  const match = /^([23])(\d{2})(\d{2})(\d{2})\d*$/.exec(digits);
  if (match === null) return false;
  const [, century = "", yy = "", mm = "", dd = ""] = match;
  const year = (century === "2" ? 1900 : 2000) + Number(yy);
  const date = new Date(Date.UTC(year, Number(mm) - 1, Number(dd)));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === Number(mm) - 1 &&
    date.getUTCDate() === Number(dd)
  );
}
