/**
 * Stackra file contract:
 * Purpose: the props every runtime's `TimePicker` takes: a TimeField with a button that opens a time wheel.
 * Boundary: types only; the wheel's open state is the overlay vocabulary (ADR 0312).
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0312.
 */
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";
import type { TimeFieldContractProps } from "#contracts/types/time-field-contract-props.type";

/** Props shared by the web and native `TimePicker`. */
export interface TimePickerContractProps extends TimeFieldContractProps, OpenStateContractProps {
  /** The step of the wheel's minutes; defaults to 5. */
  readonly minuteStep?: number | undefined;
  /** The spoken name of the button that opens the wheel; defaults to the `ui` catalogue's phrase. */
  readonly pickerButtonLabel?: string | undefined;
}
