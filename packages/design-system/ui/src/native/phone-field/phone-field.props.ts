/**
 * Stackra file contract:
 * Purpose: `PhoneFieldProps`, the props of the native `PhoneField`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: react-native
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { PhoneFieldContractProps } from "#contracts/types/phone-field-contract-props.type";

/** Props of the native PhoneField. */
export type PhoneFieldProps = PhoneFieldContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
