/**
 * Stackra file contract:
 * Purpose: `FunnelChartProps`, the props of the native `FunnelChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { FunnelChartContractProps } from "#contracts/types/funnel-chart-contract-props.type";

/** Props of the native FunnelChart. */
export type FunnelChartProps = FunnelChartContractProps & {
  readonly className?: string | undefined;
};
