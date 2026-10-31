/**
 * Stackra file contract:
 * Purpose: `ChordDiagramContractProps`, the props of every runtime's `ChordDiagram`: the groups round the circle, the
 *          flows between them, the name, the number format, the palette and the size.
 * Boundary: types only. Groups and flows reuse the sankey's node and link shapes. Like a pie, the ring reads clockwise
 *           from the top and is never mirrored.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (gap wave, 2026-10-31).
 */
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { SankeyLink } from "#contracts/types/sankey-link.type";
import type { SankeyNode } from "#contracts/types/sankey-node.type";

/** Props shared by the web and native `ChordDiagram`. */
export interface ChordDiagramContractProps {
  /** The groups round the circle, clockwise from the top. */
  readonly nodes: readonly SankeyNode[];
  /** The flows, each from one group to another; a group's arc is as long as all that leaves and reaches it. */
  readonly links: readonly SankeyLink[];
  /** The chart's accessible name and the data table's caption, such as "Moves between plans". */
  readonly label: string;
  /** How values are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** `accent` steps (the default) or the `categorical` set, by group position. */
  readonly palette?: ChartPalette | undefined;
  /** The square plot's side in pixels; 320 by default. */
  readonly size?: number | undefined;
}
