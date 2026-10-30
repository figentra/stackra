/**
 * Stackra file contract:
 * Purpose: `dateRangeOfPreset(preset, today)`, the first and last day of a preset range counted from `today`
 *          ("last 7 days" ends today and holds seven days;
 *          a quarter runs January to March, April to June, and so on).
 * Boundary: pure; Gregorian `CalendarDate`s.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28).
 */
import { endOfMonth, startOfMonth, startOfYear, type CalendarDate } from "@internationalized/date";

import type { DateRangePreset } from "#contracts/enums/date-range-preset.enum";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";

/**
 * The range a preset stands for.
 * @param preset - the preset
 * @param today - the day to count from
 * @returns both ends of the range
 */
export function dateRangeOfPreset(
  preset: DateRangePreset,
  today: CalendarDate,
): { readonly start: CalendarDate; readonly end: CalendarDate } & DateRangeValue {
  switch (preset) {
    case "today": {
      return { start: today, end: today };
    }
    case "yesterday": {
      const day = today.subtract({ days: 1 });
      return { start: day, end: day };
    }
    case "last_7_days": {
      return { start: today.subtract({ days: 6 }), end: today };
    }
    case "last_30_days": {
      return { start: today.subtract({ days: 29 }), end: today };
    }
    case "last_90_days": {
      return { start: today.subtract({ days: 89 }), end: today };
    }
    case "this_month": {
      return { start: startOfMonth(today), end: endOfMonth(today) };
    }
    case "last_month": {
      const month = startOfMonth(today).subtract({ months: 1 });
      return { start: month, end: endOfMonth(month) };
    }
    case "this_quarter":
    case "last_quarter": {
      const back = preset === "last_quarter" ? 3 : 0;
      const first = startOfMonth(today)
        .set({ month: Math.floor((today.month - 1) / 3) * 3 + 1 })
        .subtract({ months: back });
      return { start: first, end: endOfMonth(first.add({ months: 2 })) };
    }
    case "this_year": {
      return { start: startOfYear(today), end: today.set({ month: 12, day: 31 }) };
    }
    case "last_12_months": {
      return { start: today.subtract({ years: 1 }).add({ days: 1 }), end: today };
    }
  }
}
