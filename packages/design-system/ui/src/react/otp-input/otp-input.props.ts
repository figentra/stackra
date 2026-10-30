/**
 * Stackra file contract:
 * Purpose: `OtpInputProps`, the props of the web `OtpInput`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { OtpInputContractProps } from "#contracts/types/otp-input-contract-props.type";

/** Props of the web OtpInput. */
export type OtpInputProps = OtpInputContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
