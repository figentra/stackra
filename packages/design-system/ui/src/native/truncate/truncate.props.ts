/**
 * Stackra file contract:
 * Purpose: `TruncateProps`, the props of the native `Truncate`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { TruncateContractProps } from "#contracts/types/truncate-contract-props.type";

/** Props of the native Truncate. */
export type TruncateProps = TruncateContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
