/**
 * Stackra file contract:
 * Purpose: `MeterSegment`, one part of a stacked meter: its key, label, amount and optional theme colour.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** One part of a stacked meter. */
export interface MeterSegment {
  /** A stable id, unique within the meter. */
  readonly key: string;
  /** The name shown in the legend. */
  readonly label: string;
  /** The size of this part. */
  readonly value: number;
  /** Its theme colour; the palette picks one by position by default. */
  readonly color?: ChartColor | undefined;
}
