/**
 * Stackra file contract:
 * Purpose: `PolarChartProps`, the props of the web `PolarChart` in `polar-chart.tsx`: the shared contract and a class
 *          name.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { PolarChartContractProps } from "#contracts/types/polar-chart-contract-props.type";

/** Props of the web PolarChart. */
export type PolarChartProps = PolarChartContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
