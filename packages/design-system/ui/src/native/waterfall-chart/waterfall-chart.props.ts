/**
 * Stackra file contract:
 * Purpose: `WaterfallChartProps`, the props of the native `WaterfallChart` in `waterfall-chart.tsx`: the shared contract and a class name.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { WaterfallChartContractProps } from "#contracts/types/waterfall-chart-contract-props.type";

/** Props of the native WaterfallChart. */
export type WaterfallChartProps = WaterfallChartContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
