/**
 * Stackra file contract:
 * Purpose: `SunburstItem`, one slice of a sunburst chart and the slices nested in it.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** One slice and its children, drawn on the next ring out. */
export interface SunburstItem {
  readonly key: string;
  readonly label: string;
  /** Its size; the sum of its children's when left out. A parent larger than its children leaves a gap. */
  readonly value?: number | undefined;
  /** Its theme colour; a top slice takes the palette's by position and its children share it. */
  readonly color?: ChartColor | undefined;
  readonly children?: readonly SunburstItem[] | undefined;
}
