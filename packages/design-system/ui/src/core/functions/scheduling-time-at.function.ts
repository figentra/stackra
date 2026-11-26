/**
 * Stackra file contract:
 * Purpose: `schedulingTimeAt(position, columns)`, the moment at a position on a SchedulingBoard, the inverse of
 *          `schedulingPositionOf`: inside a column by its fraction, the first column's start before it and the last
 *          column's end past it.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingColumn } from "#core/types/scheduling-column.type";

/**
 * The moment at a position.
 * @param position - columns from the first
 * @param columns - the view's columns, earliest first
 * @returns the moment; the epoch when there are no columns
 * @example
 * schedulingTimeAt(2.5, columns); // 09:15 for 30-minute slots from 08:00
 */
export function schedulingTimeAt(position: number, columns: readonly SchedulingColumn[]): Date {
  const first = columns[0];
  const last = columns.at(-1);
  if (!first || !last) return new Date(0);
  if (position <= 0) return first.start;
  if (position >= columns.length) return last.end;
  const index = Math.floor(position);
  const column = columns[index] ?? last;
  const span = column.end.getTime() - column.start.getTime();
  return new Date(column.start.getTime() + (position - index) * span);
}
