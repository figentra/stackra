/**
 * Stackra file contract:
 * Purpose: `GaugeChartProps`, the props of the web `GaugeChart` in `gauge-chart.tsx`: the shared contract and a class name.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { GaugeChartContractProps } from "#contracts/types/gauge-chart-contract-props.type";

/** Props of the web GaugeChart. */
export type GaugeChartProps = GaugeChartContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
