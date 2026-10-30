/**
 * Stackra file contract:
 * Purpose: `WheelTimePickerProps`, the props of the native `WheelTimePicker`.
 * Boundary: types only; the contract plus the root's own props.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { WheelTimePickerContractProps } from "#contracts/types/wheel-time-picker-contract-props.type";

/** The root's class name. */
type Styled = { readonly className?: string | undefined };

/** Props of the native WheelTimePicker. */
export type WheelTimePickerProps = WheelTimePickerContractProps & Styled;
