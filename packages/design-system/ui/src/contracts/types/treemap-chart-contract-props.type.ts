/**
 * Stackra file contract:
 * Purpose: `TreemapChartContractProps`, the props of every runtime's `TreemapChart`: the tiles, the name, the number
 *          format, the palette and the height.
 * Boundary: types only. Tiles are laid out squarified, largest first, from the reading start.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartSort } from "#contracts/enums/chart-sort.enum";
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { TreemapItem } from "#contracts/types/treemap-item.type";

/** Props shared by the web and native `TreemapChart`. */
export interface TreemapChartContractProps {
  /** The tiles to lay out. */
  readonly items: readonly TreemapItem[];
  /** The chart's accessible name, such as "Revenue by category". */
  readonly label: string;
  /** How values are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** `accent` steps (the default) or the `categorical` set. */
  readonly palette?: ChartPalette | undefined;
  /** The plot's height in pixels; 240 by default. */
  readonly height?: number | undefined;
  /** Orders the categories: largest first, smallest first, or by label; the rows' own order by default. */
  readonly sort?: ChartSort | undefined;
}
