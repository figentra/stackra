/**
 * Stackra file contract:
 * Purpose: `TrendChipProps`, the props of the native `TrendChip`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { TrendChipContractProps } from "#contracts/types/trend-chip-contract-props.type";

/** Props of the native TrendChip. */
export type TrendChipProps = TrendChipContractProps & {
  readonly className?: string | undefined;
};
