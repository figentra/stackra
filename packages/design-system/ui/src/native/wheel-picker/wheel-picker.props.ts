/**
 * Stackra file contract:
 * Purpose: `WheelPickerProps`, the props of the native `WheelPicker`.
 * Boundary: types only; each is its contract plus the root's class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { WheelPickerContractProps } from "#contracts/types/wheel-picker-contract-props.type";

/** The root's class name. */
type Styled = { readonly className?: string | undefined };

/** Props of the native WheelPicker. */
export type WheelPickerProps = WheelPickerContractProps & Styled;
