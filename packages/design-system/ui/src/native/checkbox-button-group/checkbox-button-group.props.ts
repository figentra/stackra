/**
 * Stackra file contract:
 * Purpose: `CheckboxButtonGroupProps`, the props of the native `CheckboxButtonGroup`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { CheckboxButtonGroupContractProps } from "#contracts/types/checkbox-button-group-contract-props.type";

/** Props of the native CheckboxButtonGroup. */
export type CheckboxButtonGroupProps = CheckboxButtonGroupContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
