/**
 * Stackra file contract:
 * Purpose: `schedulingConflictsOf(draft, context)`, the SchedulingBoard's own conflicts at a drag's would-be result:
 *          `closure` (block) when a closure on the row or a parent overlaps it, `overlap` (warn) when the blocks it
 *          meets there would pass the row's capacity (1 by default), `outside_hours` (warn) when working time is
 *          given and does not cover it, and `in_past` (warn) when it starts before now.
 * Boundary: pure; the board's words are added by the runtimes, and a screen's conflicts are merged after these. The
 *           overlap count is every block it meets, an upper bound on how many run at once.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardConflict } from "#contracts/types/scheduling-board-conflict.type";
import type { SchedulingBoardDraft } from "#contracts/types/scheduling-board-draft.type";
import type { SchedulingBoardInterval } from "#contracts/types/scheduling-board-interval.type";
import type { SchedulingConflictContext } from "#core/types/scheduling-conflict-context.type";

/**
 * The board's conflicts at a draft.
 * @param draft - where the drag would leave things
 * @param context - the rows, items, working time and now
 * @returns the conflicts, heaviest first
 * @example
 * schedulingConflictsOf(draft, { resources, items, now }); // [{ reason: "closure", severity: "block" }]
 */
export function schedulingConflictsOf(
  draft: SchedulingBoardDraft,
  context: SchedulingConflictContext,
): SchedulingBoardConflict[] {
  const byId = new Map(context.resources.map((resource) => [resource.id, resource]));
  const rows = [draft.resourceId];
  for (let at = byId.get(draft.resourceId)?.parentId; at !== undefined && !rows.includes(at);) {
    rows.push(at);
    at = byId.get(at)?.parentId;
  }
  const met = context.items.filter(
    (item) =>
      item.id !== draft.itemId &&
      item.start < draft.end &&
      item.end > draft.start &&
      item.resourceIds.some((id) => rows.includes(id)),
  );
  const conflicts: SchedulingBoardConflict[] = [];
  if (met.some((item) => item.kind === "closure")) {
    conflicts.push({ reason: "closure", severity: "block" });
  }
  const blocks = met.filter(
    (item) => item.kind === "booking" || item.kind === "hold" || item.kind === "block",
  );
  if (blocks.length + 1 > (byId.get(draft.resourceId)?.capacity ?? 1)) {
    conflicts.push({ reason: "overlap", severity: "warn" });
  }
  if (context.workingTime !== undefined && !covers(draft, context.workingTime)) {
    conflicts.push({ reason: "outside_hours", severity: "warn" });
  }
  if (draft.start < context.now) conflicts.push({ reason: "in_past", severity: "warn" });
  return conflicts;
}

/** Whether the row's working time covers the draft from start to end without a gap. */
function covers(
  draft: SchedulingBoardDraft,
  workingTime: readonly SchedulingBoardInterval[],
): boolean {
  let at = draft.start.getTime();
  const own = workingTime
    .filter(
      (interval) => interval.resourceId === undefined || interval.resourceId === draft.resourceId,
    )
    .toSorted((a, b) => a.start.getTime() - b.start.getTime());
  for (const interval of own) {
    if (interval.start.getTime() > at) break;
    at = Math.max(at, interval.end.getTime());
    if (at >= draft.end.getTime()) return true;
  }
  return at >= draft.end.getTime();
}
