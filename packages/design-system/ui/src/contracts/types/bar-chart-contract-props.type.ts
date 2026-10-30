/**
 * Stackra file contract:
 * Purpose: `BarChartContractProps`, the props of every runtime's `BarChart`: the cartesian props and the orientation.
 * Boundary: types only. Several series stand side by side (grouped) unless `stacked`; horizontal bars grow from the
 *           reading start.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartSort } from "#contracts/enums/chart-sort.enum";
import type { Orientation } from "#contracts/enums/orientation.enum";
import type { CartesianChartContractProps } from "#contracts/types/cartesian-chart-contract-props.type";
import type { ChartEmphasis } from "#contracts/types/chart-emphasis.type";

/** Props shared by the web and native `BarChart`. */
export interface BarChartContractProps extends CartesianChartContractProps {
  /** `vertical` columns stand on the category axis (the default); `horizontal` bars lie along it. */
  readonly orientation?: Orientation | undefined;
  /** Orders the categories: largest first, smallest first, or by label; the rows' own order by default. */
  readonly sort?: ChartSort | undefined;
  /**
   * Which column carries the colour while the rest stand back in its soft tone: `latest` (the default for one
   * unstacked series), `none` (the default for several, which keep their own colours) or an index.
   */
  readonly emphasis?: ChartEmphasis | undefined;
}
