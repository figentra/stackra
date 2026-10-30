/**
 * Stackra file contract:
 * Purpose: `WaffleChartProps`, the props of the native `WaffleChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { WaffleChartContractProps } from "#contracts/types/waffle-chart-contract-props.type";

/** Props of the native WaffleChart. */
export type WaffleChartProps = WaffleChartContractProps & {
  readonly className?: string | undefined;
};
