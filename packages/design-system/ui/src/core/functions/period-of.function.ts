/**
 * Stackra file contract:
 * Purpose: `periodOf(preset, range, mode)`, a `PeriodPicker`'s whole value from its three choices: the preset, the
 *          range and the comparison mode, the comparison range worked out by `previousRangeOf`.
 * Boundary: pure; the web and native pickers both build their value here, so they agree.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decision 17); STA-1371.
 */
import type { DateRangePreset } from "#contracts/enums/date-range-preset.enum";
import type { PeriodCompareMode } from "#contracts/enums/period-compare-mode.enum";
import type { DateRangeValue } from "#contracts/types/date-range-value.type";
import type { PeriodValue } from "#contracts/types/period-value.type";
import { previousRangeOf } from "#core/functions/previous-range-of.function";

/**
 * The picker's value.
 * @param preset - the preset picked, or `custom`
 * @param range - the period's days
 * @param mode - the comparison mode, or `null` while the comparison is off
 * @returns the value, comparison range included
 */
export function periodOf(
  preset: DateRangePreset | "custom",
  range: DateRangeValue,
  mode: PeriodCompareMode | null,
): PeriodValue {
  return { preset, range, compare: mode ? { mode, range: previousRangeOf(range, mode) } : null };
}
