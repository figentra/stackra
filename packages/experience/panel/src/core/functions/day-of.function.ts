/**
 * Stackra file contract:
 * Purpose: `dayOf(value)`, the calendar day a `YYYY-MM-DD` value holds, or null for anything else.
 * Boundary: internal: pure; the web and native date fields show their value with it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (a calendar day travels as `YYYY-MM-DD`).
 */
import { type CalendarDate, parseDate } from "@internationalized/date";

/**
 * The calendar day of `value`.
 *
 * @example
 * dayOf("2026-11-01")?.toString(); // "2026-11-01"
 */
export function dayOf(value: unknown): CalendarDate | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}
