/**
 * Stackra file contract:
 * Purpose: `TimeFieldProps`, the props of the native `TimeField`.
 * Boundary: types only; the contract plus the accessible name and the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { TimeFieldContractProps } from "#contracts/types/time-field-contract-props.type";

/** Props of the native TimeField. */
export type TimeFieldProps = TimeFieldContractProps & {
  /** The field's accessible name when the label is not a string. */
  readonly accessibilityLabel?: string | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
};
