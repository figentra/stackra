/**
 * Stackra file contract:
 * Purpose: `previousRangeOf(range, mode)`, the period a dashboard compares with: the `previous` period of the same
 *          length ending the day before `range` starts, or the same days a `year` earlier. A range of whole months
 *          (1 March to 31 March, a quarter) steps back by whole months, so March compares with all of February.
 * Boundary: pure; Gregorian `CalendarDate`s. A range with an open end has no comparison and comes back as it is.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decision 17); STA-1371.
 */
import { endOfMonth } from "@internationalized/date";

import type { PeriodCompareMode } from "#contracts/enums/period-compare-mode.enum";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";

/**
 * The comparison range of `range`.
 * @param range - the period shown
 * @param mode - the previous period of equal length, or the same period last year
 * @returns the comparison's first and last day
 */
export function previousRangeOf(range: DateRangeValue, mode: PeriodCompareMode): DateRangeValue {
  const { start, end } = range;
  if (!start || !end) return range;
  const isWholeMonths = start.day === 1 && end.compare(endOfMonth(end)) === 0;
  if (mode === "year") {
    const back = { start: start.subtract({ years: 1 }), end: end.subtract({ years: 1 }) };
    // 29 February 2024 a year back is 28 February 2023 already; a whole-month range keeps its month's real end.
    return isWholeMonths ? { ...back, end: endOfMonth(back.end) } : back;
  }
  if (isWholeMonths) {
    const months = (end.year - start.year) * 12 + end.month - start.month + 1;
    const first = start.subtract({ months });
    return { start: first, end: endOfMonth(first.add({ months: months - 1 })) };
  }
  const last = start.subtract({ days: 1 });
  return { start: last.subtract({ days: end.compare(start) }), end: last };
}
