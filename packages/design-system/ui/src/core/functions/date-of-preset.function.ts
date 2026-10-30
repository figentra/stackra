/**
 * Stackra file contract:
 * Purpose: `dateOfPreset(preset, today)`, the day a DatePicker preset stands for, counted from `today`; `today` and
 *          `yesterday` come from `dateRangeOfPreset`, so they match the range picker's.
 * Boundary: pure; Gregorian `CalendarDate`s in and out.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A).
 */
import { endOfMonth, startOfMonth, type CalendarDate } from "@internationalized/date";

import type { DatePreset } from "#contracts/enums/date-preset.enum";
import { dateRangeOfPreset } from "#core/functions/date-range-of-preset.function";

/** The day of `preset`. */
export function dateOfPreset(preset: DatePreset, today: CalendarDate): CalendarDate {
  switch (preset) {
    case "today":
    case "yesterday": {
      return dateRangeOfPreset(preset, today).start;
    }
    case "tomorrow": {
      return today.add({ days: 1 });
    }
    case "in_7_days": {
      return today.add({ days: 7 });
    }
    case "start_of_month": {
      return startOfMonth(today);
    }
    case "end_of_month": {
      return endOfMonth(today);
    }
  }
}
