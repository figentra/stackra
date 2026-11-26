/**
 * Stackra file contract:
 * Purpose: `ActivityEntry`, one row of a tenant's activity feed: what happened to which note, and when. Key
 *          `activity.activity_entry`, table `activity.activity_entries`, public ids `act_…`.
 * Boundary: data only, written by the activity listeners from the notes events and deleted by the retention job.
 *           Tenant-owned through `BelongsToTenant`: the row takes the tenant of the event it records (the listener runs
 *           in the event's scope), never one from input. Ids only: the note's title and text never reach this table.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4 and 20); ADR 0321 and 0323 d1 (`BelongsToTenant`); ADR 0239; ADR 0305.
 */
import type { PublicId } from "@stackra/contracts";
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { BelongsToTenant } from "@stackra/tenancy/node";

import type { ActivityKind } from "#modules/activity/enums/activity-kind.enum";

/** What happened to one note, one row of `activity.activity_entries`. */
export class ActivityEntry extends Model.with(HasPublicId("act"), BelongsToTenant, Timestamps) {
  /** The kind of change that happened to the note. */
  kind!: ActivityKind;

  /** The note it happened to; the note may since have been deleted. */
  noteId!: PublicId<"not">;

  /** When it happened: the event's time, not the time the listener ran. */
  occurredAt!: Date;
}
