/**
 * Stackra file contract:
 * Purpose: `dateOfDay`, a day number back to its `IsoDate`.
 * Boundary: internal; the inverse of `dayNumber`.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 2).
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import type { IsoDate } from "#core/types/iso-date.type";

/**
 * The date of day number `day`.
 *
 * @example
 * dateOfDay(1); // "1970-01-02"
 */
export function dateOfDay(day: number): IsoDate {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}
