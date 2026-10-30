/**
 * Stackra file contract:
 * Purpose: `ScatterChartProps`, the props of the web `ScatterChart` in `scatter-chart.tsx`: the shared contract and a class name.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ScatterChartContractProps } from "#contracts/types/scatter-chart-contract-props.type";

/** Props of the web ScatterChart. */
export type ScatterChartProps = ScatterChartContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
