/**
 * Stackra file contract:
 * Purpose: `earliestSunset(since)`, the earliest removal a deprecation may name: before 1.0 the next minor, from 1.0 the
 *          next major (ADR 0177 decision 6), and for a date version six months later (ADR 0136 decision 4).
 * Boundary: pure; the one formula of the deprecation window, which `deprecationProblem`, `@Deprecated` and gen read.
 * Runtime: isomorphic
 * Governing contract: ADR 0177 (decision 6); ADR 0136 (decision 4); ADR 0131 (decision 4); STA-2836.
 */

/** A release version, `major.minor.patch` with an optional prerelease. */
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/;

/** A date version, `YYYY-MM-DD`. */
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The months a dated public API stays after its deprecation (ADR 0136 decision 4). */
const DATED_WINDOW_MONTHS = 6;

/**
 * The earliest sunset of a deprecation made at `since`.
 *
 * @param since - a release version (`"0.34.2"`) or a date version (`"2026-11-26"`).
 * @returns the earliest removal (`"0.35.0"`, `"2.0.0"`, `"2027-05-26"`), or `undefined` when `since` is neither form.
 * @example
 * earliestSunset("0.34.2"); // "0.35.0"
 * earliestSunset("1.4.0"); // "2.0.0"
 * earliestSunset("2026-08-31"); // "2027-02-28"
 */
export function earliestSunset(since: string): string | undefined {
  const version = VERSION.exec(since);
  if (version !== null) {
    const major = Number(version[1]);
    const minor = Number(version[2]);
    return major === 0 ? `0.${minor + 1}.0` : `${major + 1}.0.0`;
  }
  const date = DATE.exec(since);
  if (date === null) return undefined;
  const year = Number(date[1]);
  const month = Number(date[2]);
  const day = Number(date[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  )
    return undefined;
  const target = month - 1 + DATED_WINDOW_MONTHS;
  const targetYear = year + Math.floor(target / 12);
  const targetMonth = target % 12;
  // The same day six months on, or the last day of that month when it is shorter (31 Aug gives 28 Feb).
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const out = new Date(Date.UTC(targetYear, targetMonth, Math.min(day, lastDay)));
  return out.toISOString().slice(0, 10);
}
