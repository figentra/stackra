/**
 * Stackra file contract:
 * Purpose: `TruncateProps`, the props of the web `Truncate`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { TruncateContractProps } from "#contracts/types/truncate-contract-props.type";

/** Props of the web Truncate. */
export type TruncateProps = TruncateContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
