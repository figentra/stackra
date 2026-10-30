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
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly color?: ChartColor | undefined;
}
