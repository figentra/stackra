/**
 * Stackra file contract:
 * Purpose: `RadioButtonGroupProps`, the props of the native `RadioButtonGroup`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { RadioButtonGroupContractProps } from "#contracts/types/radio-button-group-contract-props.type";

/** Props of the native RadioButtonGroup. */
export type RadioButtonGroupProps = RadioButtonGroupContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
