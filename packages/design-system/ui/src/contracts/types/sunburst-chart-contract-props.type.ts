/**
 * Stackra file contract:
 * Purpose: `SunburstChartContractProps`, the props of every runtime's `SunburstChart`: the nested slices, the name,
 *          the number format, the palette, the size and the word under the total in the middle.
 * Boundary: types only. Slices run clockwise from the top; like a pie, a sunburst is never mirrored.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { SunburstItem } from "#contracts/types/sunburst-item.type";

/** Props shared by the web and native `SunburstChart`. */
export interface SunburstChartContractProps {
  /** The top slices, each with its nested slices. */
  readonly items: readonly SunburstItem[];
  /** The chart's accessible name, such as "Revenue by category and product". */
  readonly label: string;
  /** How values are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** `accent` steps (the default) or the `categorical` set, by top slice. */
  readonly palette?: ChartPalette | undefined;
  /** The chart's width and height in pixels; 260 by default. */
  readonly size?: number | undefined;
  /** The word under the total in the middle, such as "Revenue"; no total without it. */
  readonly centerLabel?: string | undefined;
}
