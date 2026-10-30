/**
 * Stackra file contract:
 * Purpose: `ResultProps`, the props of the native `Result`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ResultContractProps } from "#contracts/types/result-contract-props.type";

/** Props of the native Result. */
export type ResultProps = ResultContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
