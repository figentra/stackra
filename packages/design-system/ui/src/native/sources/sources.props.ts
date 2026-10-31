/**
 * Stackra file contract:
 * Purpose: `SourcesProps`, the props of the native `Sources`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { SourcesContractProps } from "#contracts/types/sources-contract-props.type";

/** Props of the native Sources. */
export type SourcesProps = SourcesContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
