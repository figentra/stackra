/**
 * Stackra file contract:
 * Purpose: `PeriodPickerContractProps`, the props of every runtime's `PeriodPicker`: the dashboard period control
 *          with preset periods, a custom range and a compare-to-previous switch.
 * Boundary: types only. `onChange` gets the whole value, comparison range included, each time any part changes.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0307 (decision 17); STA-1371.
 */
import type { CalendarDate } from "@internationalized/date";

import type { DateRangePreset } from "#contracts/enums/date-range-preset.enum";
import type { PeriodValue } from "#contracts/types/period-value.type";

/** Props shared by the web and native `PeriodPicker`. */
export interface PeriodPickerContractProps {
  /** The group's accessible name; "Period" by default. */
  readonly label?: string | undefined;
  /** The current value, for a controlled picker; pair it with `onChange`. */
  readonly value?: PeriodValue | undefined;
  /** The starting value, for an uncontrolled picker; the last 30 days with no comparison by default. */
  readonly defaultValue?: PeriodValue | undefined;
  /** Called with the whole new value each time the period, the comparison or its mode changes. */
  readonly onChange?: ((value: PeriodValue) => void) | undefined;
  /** The presets offered, in order, before "Custom range"; a dashboard set by default. */
  readonly presets?: readonly DateRangePreset[] | undefined;
  /** Offers the compare switch and its mode; on by default. */
  readonly showComparison?: boolean | undefined;
  /** The day the presets count from; today by default. */
  readonly today?: CalendarDate | undefined;
  /** Refuses changes and shows the disabled style. */
  readonly isDisabled?: boolean | undefined;
}
