/**
 * Stackra file contract:
 * Purpose: `PaginationProps`, the props of the native `Pagination`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { PaginationContractProps } from "#contracts/types/pagination-contract-props.type";

/** Props of the native Pagination. */
export type PaginationProps = PaginationContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
