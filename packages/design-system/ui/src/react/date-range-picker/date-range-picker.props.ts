/**
 * Stackra file contract:
 * Purpose: `DateRangePickerProps`, the props of the web `DateRangePicker`.
 * Boundary: types only; the contract plus the root's class name and accessible name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { CalendarDate } from "@internationalized/date";

import type { DateRangePickerContractProps } from "#contracts/types/date-range-picker-contract-props.type";

/** Props of the web DateRangePicker. */
export type DateRangePickerProps = DateRangePickerContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
  /** The field's accessible name when there is no visible label. */
  readonly "aria-label"?: string | undefined;
  /** The day the presets count from; defaults to today. */
  readonly today?: CalendarDate | undefined;
};
