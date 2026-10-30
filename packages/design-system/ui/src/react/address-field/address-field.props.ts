/**
 * Stackra file contract:
 * Purpose: `AddressFieldProps`, the props of the web `AddressField`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { AddressFieldContractProps } from "#contracts/types/address-field-contract-props.type";

/** Props of the web AddressField. */
export type AddressFieldProps = AddressFieldContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
