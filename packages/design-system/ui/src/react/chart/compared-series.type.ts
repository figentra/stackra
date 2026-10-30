/**
 * Stackra file contract:
 * Purpose: `ComparedSeries`, one previous-period twin a web cartesian chart draws dashed beside its series.
 * Boundary: types only; not exported from the package.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ChartSeries } from "#contracts/types/chart-series.type";

/** One previous-period twin. */
export interface ComparedSeries {
  /** The series it shadows. */
  readonly series: ChartSeries;
  /** That series' position, which picks the shared colour. */
  readonly index: number;
  /** The row key of the previous values. */
  readonly key: string;
  /** The name shown for the previous values. */
  readonly label: string;
}
