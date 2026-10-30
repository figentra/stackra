/**
 * Stackra file contract:
 * Purpose: `TimelineChartProps`, the props of the web `TimelineChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { TimelineChartContractProps } from "#contracts/types/timeline-chart-contract-props.type";

/** Props of the web TimelineChart. */
export type TimelineChartProps = TimelineChartContractProps & {
  readonly className?: string | undefined;
};
