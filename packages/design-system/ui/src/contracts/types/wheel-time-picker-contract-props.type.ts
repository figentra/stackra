/**
 * Stackra file contract:
 * Purpose: the props every runtime's `WheelTimePicker` takes: a time of day on wheels (hour, minute and, in a 12-hour
 *          cycle, the period).
 * Boundary: types only; the wheels are a WheelPicker's.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3).
 */
import type { HourCycle } from "#contracts/enums/hour-cycle.enum";
import type { TimeValue } from "#contracts/types/time-value.type";

/** Props shared by the web and native `WheelTimePicker`. */
export interface WheelTimePickerContractProps {
  /** The time, for a controlled picker. */
  readonly value?: TimeValue | undefined;
  /** The starting time, for an uncontrolled picker; defaults to midnight. */
  readonly defaultValue?: TimeValue | undefined;
  /** Called with each new time. */
  readonly onChange?: ((value: TimeValue) => void) | undefined;
  /** The step of the minute wheel, for example 5 or 15; defaults to 1. */
  readonly minuteStep?: number | undefined;
  /** 12 or 24 hours; defaults to the locale's. */
  readonly hourCycle?: HourCycle | undefined;
  /** The spoken name of the picker. */
  readonly label?: string | undefined;
  /** True to refuse every change. */
  readonly isDisabled?: boolean | undefined;
}
