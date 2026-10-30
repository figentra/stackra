/**
 * Stackra file contract:
 * Purpose: `PeriodComparison`, the period a `PeriodPicker` compares with: its mode and the range worked out from it.
 * Boundary: types only; the range is `previousRangeOf(period, mode)`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { PeriodCompareMode } from "#contracts/enums/period-compare-mode.enum";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";

/** The comparison period. */
export interface PeriodComparison {
  /** The previous period of the same length, or the same period a year earlier. */
  readonly mode: PeriodCompareMode;
  /** Its first and last day. */
  readonly range: DateRangeValue;
}
