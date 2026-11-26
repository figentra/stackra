/**
 * Stackra file contract:
 * Purpose: `activityEntryViewOf(entry)`, the caller-facing `ActivityEntryView` of a stored `ActivityEntry`.
 * Boundary: pure; copies the four fields a caller may see, so the tenant id and the row's own timestamps stay in the
 *           module.
 * Runtime: node
 * Governing contract: ADR 0294; ADR 0305 (one declaration per file).
 */
import type { ActivityEntry } from "#modules/activity/models/activity-entry.model";
import { ActivityEntryView } from "#modules/activity/schemas/activity-entry-view.schema";

/**
 * The view of `entry`.
 *
 * @example
 * activityEntryViewOf(entry).kind; // "note_created"
 */
export function activityEntryViewOf(entry: ActivityEntry): ActivityEntryView {
  return ActivityEntryView.create({
    id: entry.id,
    kind: entry.kind,
    noteId: entry.noteId,
    occurredAt: entry.occurredAt,
  });
}
