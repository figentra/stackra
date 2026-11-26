/**
 * Stackra file contract:
 * Purpose: unit tests of `activityEntryViewOf`: the view copies the entry's public id, kind, note and time, and nothing
 *          else of the row (no tenant id, no row timestamps).
 * Boundary: test only; pure function over a model instance built in the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ActivityKind } from "#modules/activity/enums/activity-kind.enum";
import { activityEntryViewOf } from "#modules/activity/functions/activity-entry-view-of.function";
import { ActivityEntry } from "#modules/activity/models/activity-entry.model";

describe(activityEntryViewOf, () => {
  it("shows the id, kind, note and time, and keeps the tenant and row times in the module", () => {
    const occurredAt = new Date("2026-06-01T09:00:00.000Z");
    const entry = Object.assign(new ActivityEntry(), {
      id: "act_01ja0000000000000000000001" as PublicId<"act">,
      kind: ActivityKind.NoteDeleted,
      noteId: "not_01ja0000000000000000000001" as PublicId<"not">,
      occurredAt,
      tenantId: "scp_01ja0000000000000000000001",
      createdAt: new Date("2026-06-01T09:00:02.000Z"),
      updatedAt: new Date("2026-06-01T09:00:02.000Z"),
    });

    expect({ ...activityEntryViewOf(entry) }).toEqual({
      id: "act_01ja0000000000000000000001",
      kind: ActivityKind.NoteDeleted,
      noteId: "not_01ja0000000000000000000001",
      occurredAt,
    });
  });
});
