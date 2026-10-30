/**
 * Stackra file contract:
 * Purpose: `DateTimePickerProps`, the props of the native `DateTimePicker`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { DateTimePickerContractProps } from "#contracts/types/date-time-picker-contract-props.type";

/** Props of the native DateTimePicker. */
export type DateTimePickerProps = DateTimePickerContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
