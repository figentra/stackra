/**
 * Stackra file contract:
 * Purpose: `SunburstChartProps`, the props of the web `SunburstChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { SunburstChartContractProps } from "#contracts/types/sunburst-chart-contract-props.type";

/** Props of the web SunburstChart. */
export type SunburstChartProps = SunburstChartContractProps & {
  readonly className?: string | undefined;
};
