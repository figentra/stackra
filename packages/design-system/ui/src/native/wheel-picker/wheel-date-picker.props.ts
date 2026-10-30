/**
 * Stackra file contract:
 * Purpose: `WheelDatePickerProps`, the props of the native `WheelDatePicker`.
 * Boundary: types only; the contract plus the root's own props.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { WheelDatePickerContractProps } from "#contracts/types/wheel-date-picker-contract-props.type";

/** The root's class name. */
type Styled = { readonly className?: string | undefined };

/** Props of the native WheelDatePicker. */
export type WheelDatePickerProps = WheelDatePickerContractProps & Styled;
