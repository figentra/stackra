/**
 * Stackra file contract:
 * Purpose: `schedulingPlacementsOf(items, resourceId, ancestors, columns)`, the items of one SchedulingBoard row
 *          placed in columns: its own items and its parents' (faded, `inherited`); working time as bands behind,
 *          closures across the row, and every other block in side-by-side lanes for those that overlap (each group of
 *          overlapping blocks shares the height; a block takes the first lane free at its start).
 * Boundary: pure; an item wholly outside the columns, or in hours not shown, is left out, and one running past them
 *           is cut at their edge and marked clipped.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardItem } from "#contracts/types/scheduling-board-item.type";
import { schedulingPositionOf } from "#core/functions/scheduling-position-of.function";
import { schedulingTimeAt } from "#core/functions/scheduling-time-at.function";
import type { PlacedSchedulingItem } from "#core/types/placed-scheduling-item.type";
import type { SchedulingColumn } from "#core/types/scheduling-column.type";

/**
 * The placed items of a row.
 * @param items - every item
 * @param resourceId - the row's resource
 * @param ancestors - its parents' ids, whose items show faded
 * @param columns - the view's columns
 * @returns bands and covers first, then blocks by start
 * @example
 * schedulingPlacementsOf(items, "court-1", [], columns).filter((placed) => placed.layer === "block");
 */
export function schedulingPlacementsOf(
  items: readonly SchedulingBoardItem[],
  resourceId: string,
  ancestors: readonly string[],
  columns: readonly SchedulingColumn[],
): PlacedSchedulingItem[] {
  const placed: PlacedSchedulingItem[] = [];
  const blocks: { item: SchedulingBoardItem; inherited: boolean; start: number; end: number }[] =
    [];
  const clips = (item: SchedulingBoardItem, start: number, end: number) => ({
    clippedStart: item.start.getTime() < schedulingTimeAt(start, columns).getTime(),
    clippedEnd: item.end.getTime() > schedulingTimeAt(end, columns).getTime(),
  });
  for (const item of items) {
    const mine = item.resourceIds.includes(resourceId);
    const inherited = !mine && item.resourceIds.some((id) => ancestors.includes(id));
    if (!mine && !inherited) continue;
    const start = schedulingPositionOf(item.start, columns);
    const end = schedulingPositionOf(item.end, columns);
    if (end <= start) continue;
    if (item.kind === "working_time" || item.kind === "closure") {
      placed.push({
        item,
        offset: start,
        length: end - start,
        layer: item.kind === "working_time" ? "band" : "cover",
        lane: 0,
        lanes: 1,
        inherited,
        ...clips(item, start, end),
      });
    } else {
      blocks.push({ item, inherited, start, end });
    }
  }
  let group: { block: (typeof blocks)[number]; lane: number }[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;
  const close = () => {
    for (const { block, lane } of group) {
      placed.push({
        item: block.item,
        offset: block.start,
        length: block.end - block.start,
        layer: "block",
        lane,
        lanes: laneEnds.length,
        inherited: block.inherited,
        ...clips(block.item, block.start, block.end),
      });
    }
    group = [];
    laneEnds = [];
  };
  for (const block of blocks.toSorted((a, b) => a.start - b.start || b.end - a.end)) {
    if (block.start >= groupEnd) close();
    groupEnd = Math.max(group.length === 0 ? -Infinity : groupEnd, block.end);
    let lane = laneEnds.findIndex((end) => end <= block.start);
    if (lane === -1) lane = laneEnds.push(block.end) - 1;
    else laneEnds[lane] = block.end;
    group.push({ block, lane });
  }
  close();
  return placed;
}
