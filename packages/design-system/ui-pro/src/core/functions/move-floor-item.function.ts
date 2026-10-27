/**
 * Stackra file contract:
 * Purpose: `moveFloorItem(item, dx, dy, bounds)`, a floor-plan item moved by a number of cells, snapped to whole
 *          cells and kept inside the plan with its size.
 * Boundary: internal; pure. The caller decides whether the moved item may be saved.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { FloorItem } from "#contracts/types/floor-item.type";
import type { FloorBounds } from "#core/types/floor-bounds.type";

/**
 * `item` moved by `dx` and `dy` cells, rounded to whole cells and kept inside `bounds`.
 *
 * @example
 * moveFloorItem(table, 1.4, -0.6, { columns: 20, rows: 12 }); // one cell toward the inline end, one up
 */
export function moveFloorItem(
  item: FloorItem,
  dx: number,
  dy: number,
  bounds: FloorBounds,
): FloorItem {
  const x = Math.min(
    Math.max(item.x + Math.round(dx), 0),
    Math.max(bounds.columns - item.width, 0),
  );
  const y = Math.min(Math.max(item.y + Math.round(dy), 0), Math.max(bounds.rows - item.height, 0));
  return { ...item, x, y };
}
