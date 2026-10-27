/**
 * Stackra file contract:
 * Purpose: one item on a floor plan: a table, a wall or a label, placed on the plan's grid by its cell, with its size
 *          in cells and, for a table, its seat count.
 * Boundary: types only; the caller's records (one plan per area). Positions are logical: `x` counts from the
 *           inline start, so a right-to-left plan mirrors without new data.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { FloorItemShape } from "#contracts/enums/floor-item-shape.enum";

/** One item on a floor plan. */
export interface FloorItem {
  /** The item's id. */
  readonly id: string;
  /** A table, a wall or a label. */
  readonly shape: FloorItemShape;
  /** Its name as shown and announced (`T12`, `Bar`). */
  readonly label: string;
  /** Its first column, from the inline start, in cells. */
  readonly x: number;
  /** Its first row, from the top, in cells. */
  readonly y: number;
  /** Its width, in cells (one at least). */
  readonly width: number;
  /** Its height, in cells (one at least). */
  readonly height: number;
  /** A table's seat count. */
  readonly seats?: number | undefined;
  /** Whether the editor may move or resize it; true when left out. */
  readonly isMovable?: boolean | undefined;
}
