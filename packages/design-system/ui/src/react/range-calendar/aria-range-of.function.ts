/**
 * Stackra file contract:
 * Purpose: `ariaRangeOf(range)`, a `DateRangeValue` as React Aria wants it: both ends, or `null` while either is missing.
 * Boundary: pure; `undefined` stays `undefined` (uncontrolled).
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { CalendarDate } from "@internationalized/date";

import type { DateRangeValue } from "#contracts/types/date-range-value.type";

/** A complete range for React Aria, or `null` while either end is missing. */
export const ariaRangeOf = (
  range: DateRangeValue | null | undefined,
): { start: CalendarDate; end: CalendarDate } | null | undefined =>
  range === undefined
    ? undefined
    : range?.start && range.end
      ? { start: range.start, end: range.end }
      : null;
