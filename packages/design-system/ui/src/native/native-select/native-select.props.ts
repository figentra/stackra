/**
 * Stackra file contract:
 * Purpose: `NativeSelectProps`, the props of the native `NativeSelect`.
 * Boundary: types only; the contract plus the accessible name and the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { NativeSelectContractProps } from "#contracts/types/native-select-contract-props.type";

/** Props of the native NativeSelect. */
export type NativeSelectProps = NativeSelectContractProps & {
  /** The field's accessible name when the label is not a string. */
  readonly accessibilityLabel?: string | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
};
