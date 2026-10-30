/**
 * Stackra file contract:
 * Purpose: `ScatterChartContractProps`, the props the web and native `ScatterChart` share: points placed by two
 *          numbers, grouped into series, and sized by a third to make a bubble chart.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ChartReference } from "#contracts/types/chart-reference.type";
import type { ChartContractProps } from "#contracts/types/chart-contract-props.type";

/** Props shared by the web and native `ScatterChart`. */
export interface ScatterChartContractProps extends ChartContractProps {
  /** The key of each point's horizontal number. */
  readonly xKey: string;
  /** The key of each point's vertical number. */
  readonly yKey: string;
  /** The key of a third number that sizes each point: a bubble chart. Every point is the same size without it. */
  readonly sizeKey?: string | undefined;
  /** The key naming the series a point belongs to (a series' `key`); every point is in the first series without it. */
  readonly groupKey?: string | undefined;
  /** What the horizontal number is, such as "Price": the axis title and the data table's header. */
  readonly xLabel: string;
  /** What the vertical number is, such as "Units sold". */
  readonly yLabel: string;
  /** What the size is, such as "Revenue". */
  readonly sizeLabel?: string | undefined;
  /** How the horizontal numbers are written; `valueFormat` writes the vertical ones and the sizes. */
  readonly xFormat?: Intl.NumberFormatOptions | undefined;
  /** Target lines and threshold bands on the vertical axis. */
  readonly references?: readonly ChartReference[] | undefined;
}
