/**
 * Stackra file contract:
 * Purpose: `SankeyChartContractProps`, the props of every runtime's `SankeyChart`: the nodes, the flows between them,
 *          the name, the number format, the palette and the height.
 * Boundary: types only. Columns run from the reading start: left to right in English, right to left in Arabic.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { SankeyLink } from "#contracts/types/sankey-link.type";
import type { SankeyNode } from "#contracts/types/sankey-node.type";

/** Props shared by the web and native `SankeyChart`. */
export interface SankeyChartContractProps {
  /** The nodes; a node's column is the longest chain of flows that leads to it. */
  readonly nodes: readonly SankeyNode[];
  /** The flows, each from one node to another. */
  readonly links: readonly SankeyLink[];
  /** The chart's accessible name and the data table's caption, such as "Where visitors go, October". */
  readonly label: string;
  /** How values are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** `accent` steps (the default) or the `categorical` set, by node position. */
  readonly palette?: ChartPalette | undefined;
  /** The plot's height in pixels; 280 by default. */
  readonly height?: number | undefined;
}
