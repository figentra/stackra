/**
 * Stackra file contract:
 * Purpose: `ChartAnnotation`, a mark on a cartesian chart's category axis: a dashed guide through one category (a
 *          launch, an outage, a price change) with a short label at its top.
 * Boundary: types only. `at` must equal a row's category value as given in the data.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** A note pinned to one category. */
export interface ChartAnnotation {
  /** The category it marks, as in the rows' `xKey` value, such as "2026-03" or "Mar". */
  readonly at: string | number;
  /** What happened there, such as "Launch"; written at the guide's top and read after the data table. */
  readonly label: string;
  /** Its theme colour; the muted text colour by default. */
  readonly color?: ChartColor | "muted" | undefined;
}
