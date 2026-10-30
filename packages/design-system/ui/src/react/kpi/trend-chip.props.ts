/**
 * Stackra file contract:
 * Purpose: `TrendChipProps`, the props of the web `TrendChip`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decision 15); STA-1371.
 */
import type { TrendChipContractProps } from "#contracts/types/trend-chip-contract-props.type";

/** Props of the web TrendChip. */
export type TrendChipProps = TrendChipContractProps & {
  readonly className?: string | undefined;
};
