/**
 * Stackra file contract:
 * Purpose: `TreemapItem`, one tile of a treemap: its key, its label, its size and an optional theme colour.
 * Boundary: types only. A tile with no colour takes the palette's colour by its position.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** One tile of a treemap chart. */
export interface TreemapItem {
  /** A stable id, unique within the chart. */
  readonly key: string;
  /** The name shown on the tile. */
  readonly label: string;
  /** The tile's size; zero and negative values are left out. */
  readonly value: number;
  /** Its theme colour; the palette picks one by position by default. */
  readonly color?: ChartColor | undefined;
}
