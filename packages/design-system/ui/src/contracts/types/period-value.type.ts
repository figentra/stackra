/**
 * Stackra file contract:
 * Purpose: `PeriodValue`, the value of a `PeriodPicker`: the preset picked (or `custom`), its range, and the period it
 *          is compared with, if any.
 * Boundary: types only. Days are Gregorian `CalendarDate`s, as in every date field of the kit (ADR 0318).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318; ADR 0305 (one declaration per file); STA-1371.
 */
import type { DateRangePreset } from "#contracts/enums/date-range-preset.enum";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";
import type { PeriodComparison } from "#contracts/types/period-comparison.type";

/** A dashboard period and what it is compared with. */
export interface PeriodValue {
  /** The preset the range came from, or `custom` for days picked on the calendar. */
  readonly preset?: DateRangePreset | "custom" | undefined;
  /** The period's first and last day. */
  readonly range: DateRangeValue;
  /** The period compared with; `null` or absent when the comparison is off. */
  readonly compare?: PeriodComparison | null | undefined;
}
