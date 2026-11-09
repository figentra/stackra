/**
 * Stackra file contract:
 * Purpose: `schedulingShadeOf(resourceId, workingTime, columns)`, the stretches of one SchedulingBoard row outside
 *          its working time, in columns, for shading: the row's own stretches and those naming no row count.
 * Boundary: pure; with no working time given nothing is shaded, and with none for the row the whole row is.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardInterval } from "#contracts/types/scheduling-board-interval.type";
import { schedulingPositionOf } from "#core/functions/scheduling-position-of.function";
import type { SchedulingColumn } from "#core/types/scheduling-column.type";
import type { SchedulingSpan } from "#core/types/scheduling-span.type";

/**
 * The shaded stretches of a row.
 * @param resourceId - the row's resource
 * @param workingTime - every stretch of working time, or undefined for none given
 * @param columns - the view's columns
 * @returns the stretches outside working time, earliest first
 * @example
 * schedulingShadeOf("coach-1", [{ start: nine, end: five }], columns); // before nine and after five
 */
export function schedulingShadeOf(
  resourceId: string,
  workingTime: readonly SchedulingBoardInterval[] | undefined,
  columns: readonly SchedulingColumn[],
): SchedulingSpan[] {
  if (workingTime === undefined) return [];
  const open = workingTime
    .filter((interval) => interval.resourceId === undefined || interval.resourceId === resourceId)
    .map((interval) => ({
      start: schedulingPositionOf(interval.start, columns),
      end: schedulingPositionOf(interval.end, columns),
    }))
    .filter(({ start, end }) => end > start)
    .toSorted((a, b) => a.start - b.start);
  const shade: SchedulingSpan[] = [];
  let at = 0;
  for (const { start, end } of open) {
    if (start > at) shade.push({ offset: at, length: start - at });
    at = Math.max(at, end);
  }
  if (at < columns.length) shade.push({ offset: at, length: columns.length - at });
  return shade;
}
