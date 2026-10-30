/**
 * Stackra file contract:
 * Purpose: `PercentValueProps`, the props of the web `PercentValue`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { PercentValueContractProps } from "#contracts/types/percent-value-contract-props.type";

/** Props of the web PercentValue. */
export type PercentValueProps = PercentValueContractProps & {
  /** Styles the text. */
  readonly className?: string | undefined;
};
