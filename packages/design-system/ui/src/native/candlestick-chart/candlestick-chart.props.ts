/**
 * Stackra file contract:
 * Purpose: `CandlestickChartProps`, the props of the native `CandlestickChart` in `candlestick-chart.tsx`: the shared contract and a class name.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { CandlestickChartContractProps } from "#contracts/types/candlestick-chart-contract-props.type";

/** Props of the native CandlestickChart. */
export type CandlestickChartProps = CandlestickChartContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
