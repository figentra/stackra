/**
 * Stackra file contract:
 * Purpose: `ChartReference`, a mark on a cartesian chart's value axis: a target line at `value`, or a threshold band
 *          from `from` to `to`, with an optional label.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** A target line or a threshold band on the value axis. */
export interface ChartReference {
  /** The line's value; leave it out for a band. */
  readonly value?: number | undefined;
  /** The band's lower edge; give `to` with it. */
  readonly from?: number | undefined;
  /** The band's upper edge. */
  readonly to?: number | undefined;
  /** What the mark means, such as "Target"; written at the line's or band's end and read in the data table. */
  readonly label?: string | undefined;
  /** Its theme colour; the muted text colour by default. */
  readonly color?: ChartColor | "muted" | undefined;
}
