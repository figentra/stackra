/**
 * Stackra file contract:
 * Purpose: the props every runtime's `OtpInput` takes: a one-time code typed into one box per digit.
 * Boundary: types only. Arabic-Indic and Persian digits typed or pasted are kept as Latin digits.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `OtpInput`. */
export interface OtpInputContractProps extends FieldContractProps<string> {
  /** How many digits; defaults to 6. */
  readonly length?: number | undefined;
  /** Called once every box is filled, with the code. */
  readonly onComplete?: ((code: string) => void) | undefined;
}
