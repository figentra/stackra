/**
 * Stackra file contract:
 * Purpose: `PercentValueProps`, the props of the native `PercentValue`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { PercentValueContractProps } from "#contracts/types/percent-value-contract-props.type";

/** Props of the native PercentValue. */
export type PercentValueProps = PercentValueContractProps & {
  /** Styles the text. */
  readonly className?: string | undefined;
};
