/**
 * Stackra file contract:
 * Purpose: `FunnelChartProps`, the props of the web `FunnelChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { FunnelChartContractProps } from "#contracts/types/funnel-chart-contract-props.type";

/** Props of the web FunnelChart. */
export type FunnelChartProps = FunnelChartContractProps & {
  readonly className?: string | undefined;
};
