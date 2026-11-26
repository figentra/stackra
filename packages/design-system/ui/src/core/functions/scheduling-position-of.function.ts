/**
 * Stackra file contract:
 * Purpose: `schedulingPositionOf(at, columns)`, where a moment falls on a SchedulingBoard, in columns from the first:
 *          a fraction inside the column holding it, the next column's start when it falls in hours not shown, 0
 *          before the first and the column count after the last.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingColumn } from "#core/types/scheduling-column.type";

/**
 * The position of a moment.
 * @param at - the moment
 * @param columns - the view's columns, earliest first
 * @returns its position in columns
 * @example
 * schedulingPositionOf(new Date("2026-11-09T09:15:00Z"), columns); // 2.5 for 30-minute slots from 08:00
 */
export function schedulingPositionOf(at: Date, columns: readonly SchedulingColumn[]): number {
  const time = at.getTime();
  for (const [index, column] of columns.entries()) {
    const start = column.start.getTime();
    const end = column.end.getTime();
    if (time < start) return index;
    if (time < end) return index + (time - start) / (end - start);
  }
  return columns.length;
}
