/**
 * Stackra file contract:
 * Purpose: `StackedMeterContractProps`, the props of every runtime's `StackedMeter`: one bar split into parts of a
 *          whole (storage by file type, seats by plan), with a legend of the parts and their amounts.
 * Boundary: types only. The bar fills from the reading start; what is left of `max` is the track.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); WCAG 2.2 SC 1.1.1 and 1.4.11; STA-1371.
 */
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { MeterSegment } from "#contracts/types/meter-segment.type";

/** Props shared by the web and native `StackedMeter`. */
export interface StackedMeterContractProps {
  /** The parts of the bar, in order. */
  readonly segments: readonly MeterSegment[];
  /** The meter's accessible name and visible title, such as "Storage". */
  readonly label: string;
  /** The whole; the segments' sum by default (a full bar). */
  readonly max?: number | undefined;
  /** How values are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** `accent` steps (the default) or the `categorical` set. */
  readonly palette?: ChartPalette | undefined;
  /** Shows the legend of parts under the bar; on by default. */
  readonly showLegend?: boolean | undefined;
}
