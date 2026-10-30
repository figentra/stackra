/**
 * Stackra file contract:
 * Purpose: `RadioButtonGroupProps`, the props of the web `RadioButtonGroup`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { RadioButtonGroupContractProps } from "#contracts/types/radio-button-group-contract-props.type";

/** Props of the web RadioButtonGroup. */
export type RadioButtonGroupProps = RadioButtonGroupContractProps & {
  /** Styles the group. */
  readonly className?: string | undefined;
};
