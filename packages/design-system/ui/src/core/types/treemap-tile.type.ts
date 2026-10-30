/**
 * Stackra file contract:
 * Purpose: `TreemapTile`, one laid-out treemap tile in percent of the plot (`treemapLayoutOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { TreemapItem } from "#contracts/types/treemap-item.type";

/** One laid-out tile, in percent of the plot. */
export interface TreemapTile {
  /** The item the tile draws. */
  readonly item: TreemapItem;
  /** The item's position in the caller's list, for its palette colour. */
  readonly index: number;
  /** The left edge, in percent of the plot width. */
  readonly x: number;
  /** The top edge, in percent of the plot height. */
  readonly y: number;
  /** The tile width, in percent of the plot. */
  readonly width: number;
  /** The tile height, in percent of the plot. */
  readonly height: number;
}
