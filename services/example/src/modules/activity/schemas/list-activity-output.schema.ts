/**
 * Stackra file contract:
 * Purpose: `ListActivityOutput`, the output of `activity.activity_entry.list@1`: one page of the feed, newest first.
 * Boundary: a shape class in its own file; `Page.of` gives `items`, `nextCursor` (absent on the last page) and
 *           `hasMore`.
 * Runtime: node
 * Governing contract: ADR 0294; the HTTP conventions (cursor pagination).
 */
import { Page } from "@stackra/validation";

import { ActivityEntryView } from "#modules/activity/schemas/activity-entry-view.schema";

/** A page of the activity feed. */
export class ListActivityOutput extends Page.of(ActivityEntryView) {}
