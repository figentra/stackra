/**
 * Stackra file contract:
 * Purpose: `WaffleChartProps`, the props of the web `WaffleChart` in `waffle-chart.tsx`: the shared contract and a
 *          class name.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { WaffleChartContractProps } from "#contracts/types/waffle-chart-contract-props.type";

/** Props of the web WaffleChart. */
export type WaffleChartProps = WaffleChartContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
