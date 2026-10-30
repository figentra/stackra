/**
 * Stackra file contract:
 * Purpose: the props every runtime's `WheelDatePicker` takes: a day on three wheels (day, month, year) in the order
 *          the locale writes them.
 * Boundary: types only; the wheels are a WheelPicker's.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { CalendarDate } from "@internationalized/date";

/** Props shared by the web and native `WheelDatePicker`. */
export interface WheelDatePickerContractProps {
  /** The day, for a controlled picker. */
  readonly value?: CalendarDate | undefined;
  /** The starting day, for an uncontrolled picker; defaults to today. */
  readonly defaultValue?: CalendarDate | undefined;
  /** Called with each new day. A day past the end of the new month is moved to its last day. */
  readonly onChange?: ((value: CalendarDate) => void) | undefined;
  /** The first year on the year wheel; defaults to 100 years before this one. */
  readonly minYear?: number | undefined;
  /** The last year on the year wheel; defaults to 10 years after this one. */
  readonly maxYear?: number | undefined;
  /** The spoken name of the picker. */
  readonly label?: string | undefined;
  /** True to refuse every change. */
  readonly isDisabled?: boolean | undefined;
}
