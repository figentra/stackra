/**
 * Stackra file contract:
 * Purpose: `TimelineChartProps`, the props of the native `TimelineChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303; STA-1371.
 */
import type { TimelineChartContractProps } from "#contracts/types/timeline-chart-contract-props.type";

/** Props of the native TimelineChart. */
export type TimelineChartProps = TimelineChartContractProps & {
  readonly className?: string | undefined;
};
