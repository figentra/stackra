/**
 * Stackra file contract:
 * Purpose: `ActivityEntryView`, one feed entry as a caller sees it: its public id, kind, note and time; the row of the
 *          activity list.
 * Boundary: a shape class in its own file; never the model, so no database id or tenant id leaves the module.
 * Runtime: node
 * Governing contract: ADR 0294; ADR 0305 (one declaration per file).
 */
import type { PublicId } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

import type { ActivityKind } from "#modules/activity/enums/activity-kind.enum";

/** One entry of the activity feed. */
export class ActivityEntryView extends Schema {
  /** The entry's public id. */
  id!: PublicId<"act">;

  /** The kind of change that happened to the note. */
  kind!: ActivityKind;

  /** The note it happened to. */
  noteId!: PublicId<"not">;

  /** When it happened. */
  occurredAt!: Date;
}
