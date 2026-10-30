/**
 * Stackra file contract:
 * Purpose: `TimePickerProps`, the props of the web `TimePicker`.
 * Boundary: types only; the TimeField's props plus the wheel's open state.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { TimePickerContractProps } from "#contracts/types/time-picker-contract-props.type";
import type { TimeFieldProps } from "#react/time-field/time-field.props";

/** Props of the web TimePicker. */
export type TimePickerProps = TimePickerContractProps &
  Omit<TimeFieldProps, keyof TimePickerContractProps>;
