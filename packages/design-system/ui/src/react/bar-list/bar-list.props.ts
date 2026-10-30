/**
 * Stackra file contract:
 * Purpose: `BarListProps`, the props of the web `BarList`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { BarListContractProps } from "#contracts/types/bar-list-contract-props.type";

/** Props of the web BarList. */
export type BarListProps = BarListContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
