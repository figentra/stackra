/**
 * Stackra file contract:
 * Purpose: `BarChartProps`, the props of the web `BarChart` in `bar-chart.tsx`: the shared contract and a class name.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { BarChartContractProps } from "#contracts/types/bar-chart-contract-props.type";

/** Props of the web BarChart. */
export type BarChartProps = BarChartContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
