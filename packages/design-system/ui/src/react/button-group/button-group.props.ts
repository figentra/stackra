/**
 * Stackra file contract:
 * Purpose: `ButtonGroupProps`, the props of the web `ButtonGroup`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ButtonGroupContractProps } from "#contracts/types/button-group-contract-props.type";

/** Props of the web ButtonGroup. */
export type ButtonGroupProps = ButtonGroupContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
