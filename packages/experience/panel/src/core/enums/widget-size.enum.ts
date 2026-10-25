/**
 * Stackra file contract:
 * Purpose: `WidgetSize`, the width of a widget on a 12-column grid, with its column count as case data.
 * Boundary: an enum (`Enum.of`); `Enum.meta(WidgetSize, size).columns` is the span the grid gives the tile.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 18: Small 3, Medium 6, Large 9, Full 12); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * A widget's width.
 *
 * @example
 * Enum.meta(WidgetSize, WidgetSize.Medium).columns; // 6
 */
export const WidgetSize = Enum.of({
  /** A quarter of the grid. */
  Small: ["small", { columns: 3 }],
  /** Half of the grid. */
  Medium: ["medium", { columns: 6 }],
  /** Three quarters of the grid. */
  Large: ["large", { columns: 9 }],
  /** The whole row. */
  Full: ["full", { columns: 12 }],
});

/** One of the codes above. */
export type WidgetSize = Enum.Value<typeof WidgetSize>;
