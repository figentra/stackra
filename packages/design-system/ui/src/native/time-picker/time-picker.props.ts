/**
 * Stackra file contract:
 * Purpose: `TimePickerProps`, the props of the native `TimePicker`.
 * Boundary: types only; the TimeField's props plus the wheel's open state.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { TimePickerContractProps } from "#contracts/types/time-picker-contract-props.type";
import type { TimeFieldProps } from "#native/time-field/time-field.props";

/** Props of the native TimePicker. */
export type TimePickerProps = TimePickerContractProps &
  Omit<TimeFieldProps, keyof TimePickerContractProps>;
