/**
 * Stackra file contract:
 * Purpose: `resizeFloorItem(item, dw, dh, bounds)`, a floor-plan item grown or shrunk from its inline-end and bottom
 *          edges by a number of cells, snapped to whole cells, one cell at least, and kept inside the plan.
 * Boundary: internal; pure. The caller decides whether the resized item may be saved.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { FloorItem } from "#contracts/types/floor-item.type";
import type { FloorBounds } from "#core/types/floor-bounds.type";

/**
 * `item` resized by `dw` and `dh` cells, rounded, one cell at least and inside `bounds`.
 *
 * @example
 * resizeFloorItem(table, 1, 0, { columns: 20, rows: 12 }); // one cell wider
 */
export function resizeFloorItem(
  item: FloorItem,
  dw: number,
  dh: number,
  bounds: FloorBounds,
): FloorItem {
  const width = Math.min(
    Math.max(item.width + Math.round(dw), 1),
    Math.max(bounds.columns - item.x, 1),
  );
  const height = Math.min(
    Math.max(item.height + Math.round(dh), 1),
    Math.max(bounds.rows - item.y, 1),
  );
  return { ...item, width, height };
}
