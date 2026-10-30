/**
 * Stackra file contract:
 * Purpose: `DateRangePickerProps`, the props of the native `DateRangePicker`.
 * Boundary: types only; the contract plus the accessible name, the class name and the day presets count from.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { CalendarDate } from "@internationalized/date";

import type { DateRangePickerContractProps } from "#contracts/types/date-range-picker-contract-props.type";

/** Props of the native DateRangePicker. */
export type DateRangePickerProps = DateRangePickerContractProps & {
  /** The field's accessible name when the label is not a string. */
  readonly accessibilityLabel?: string | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
  /** The day the presets count from; defaults to today. */
  readonly today?: CalendarDate | undefined;
};
