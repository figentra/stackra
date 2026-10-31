/**
 * Stackra file contract:
 * Purpose: `TreeDiagramContractProps`, the props of every runtime's `TreeDiagram`: the tree, the name, the number
 *          format, the palette and the height.
 * Boundary: types only. Levels run from the reading start: left to right in English, right to left in Arabic.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (gap wave, 2026-10-31).
 */
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { TreeDiagramItem } from "#contracts/types/tree-diagram-item.type";

/** Props shared by the web and native `TreeDiagram`. */
export interface TreeDiagramContractProps {
  /** The top nodes; usually one root. */
  readonly items: readonly TreeDiagramItem[];
  /** The chart's accessible name and the data table's caption, such as "Teams and their leads". */
  readonly label: string;
  /** How values are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** `accent` steps (the default) or the `categorical` set, by branch position. */
  readonly palette?: ChartPalette | undefined;
  /** The plot's height in pixels; 28 per leaf by default. */
  readonly height?: number | undefined;
}
