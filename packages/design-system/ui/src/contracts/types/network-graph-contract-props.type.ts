/**
 * Stackra file contract:
 * Purpose: `NetworkGraphContractProps`, the props of every runtime's `NetworkGraph`: the nodes, the links between
 *          them, the name, the number format, the palette and the height.
 * Boundary: types only. The layout is a force layout run to rest, the same on every render and every runtime; it has
 *           no reading direction, so Arabic shows its mirror image.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (gap wave, 2026-10-31).
 */
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { NetworkLink } from "#contracts/types/network-link.type";
import type { NetworkNode } from "#contracts/types/network-node.type";

/** Props shared by the web and native `NetworkGraph`. */
export interface NetworkGraphContractProps {
  /** The nodes. */
  readonly nodes: readonly NetworkNode[];
  /** The links; links to unknown nodes are left out. */
  readonly links: readonly NetworkLink[];
  /** The chart's accessible name and the data table's caption, such as "Who works with whom". */
  readonly label: string;
  /** How values are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** `accent` steps (the default) or the `categorical` set, by group or node position. */
  readonly palette?: ChartPalette | undefined;
  /** The plot's height in pixels; 320 by default. */
  readonly height?: number | undefined;
}
