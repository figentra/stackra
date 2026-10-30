/**
 * Stackra file contract:
 * Purpose: `fillPatternOf()`, the values a fill handle drag or Ctrl+D writes: the source block repeated across the
 *          target block, row by row and column by column.
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid fill handle).
 */
import type { DataGridValue } from "#contracts/types/data-grid-value.type";

/**
 * The target block filled from the source block.
 * @param source - the values copied, one array per row; must not be empty
 * @param rows - the target's row count
 * @param columns - the target's column count
 * @returns the target's values
 */
// shortcut: repeats the pattern only (no 1, 2, 3 series or date steps); add series once someone asks.
export function fillPatternOf(
  source: readonly (readonly DataGridValue[])[],
  rows: number,
  columns: number,
): DataGridValue[][] {
  return Array.from({ length: rows }, (_, row) => {
    const line = source[row % source.length] ?? [];
    return Array.from({ length: columns }, (_cell, column) => line[column % line.length] ?? null);
  });
}
