/**
 * Stackra file contract:
 * Purpose: `dayNumber`, an `IsoDate` as whole days since 1970-01-01, the form every date calculation here runs on.
 * Boundary: internal. Throws a `RangeError` for anything that is not a real `YYYY-MM-DD` date.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 2).
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import type { IsoDate } from "#core/types/iso-date.type";

/** `YYYY-MM-DD`. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The day number of `date`.
 *
 * @example
 * dayNumber("1970-01-02"); // 1
 */
export function dayNumber(date: IsoDate): number {
  const ms = ISO_DATE.test(date) ? Date.parse(`${date}T00:00:00Z`) : Number.NaN;
  // Date.parse rolls 2026-02-30 over to March; reading it back catches that.
  if (Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== date)
    throw new RangeError(`Not an ISO date: ${date}`);
  return ms / MS_PER_DAY;
}
