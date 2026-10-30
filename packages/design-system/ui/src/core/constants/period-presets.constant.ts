/**
 * Stackra file contract:
 * Purpose: `PERIOD_PRESETS`, the preset periods a `PeriodPicker` offers by default: the spans a dashboard reads, not
 *          single days.
 * Boundary: data only; a caller passes its own list in `presets`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decision 17); STA-1371.
 */
import type { DateRangePreset } from "#contracts/enums/date-range-preset.enum";

/** The default preset periods, in order. */
export const PERIOD_PRESETS: readonly DateRangePreset[] = Object.freeze([
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "this_month",
  "last_month",
  "this_quarter",
  "last_quarter",
  "this_year",
  "last_12_months",
] as const);
