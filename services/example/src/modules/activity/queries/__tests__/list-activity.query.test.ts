/**
 * Stackra file contract:
 * Purpose: unit tests of `ListActivityQuery`: the `activity_entry.list` query for users and agents reads one page of the
 *          feed through the service's table read with the input's size and cursor, and answers the page with each
 *          entry's id, kind, note and time only, the next cursor and whether more follow.
 * Boundary: test only; the query is called directly with a recording stand-in for the service and a fake context. The
 *           keyset read itself (newest first, the cursor) runs on the database in `activity-feed.test.ts`; that another
 *           tenant's entries never show is the row policy's (`activity-isolation.int.test.ts`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294; ADR 0307 (rule 2); the HTTP conventions (cursor pagination).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, type PublicId } from "@stackra/contracts";
import type { TableQuery } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { ActivityKind } from "#modules/activity/enums/activity-kind.enum";
import { ActivityEntry } from "#modules/activity/models/activity-entry.model";
import { ListActivityQuery } from "#modules/activity/queries/list-activity.query";
import { ListActivityInput } from "#modules/activity/schemas/list-activity-input.schema";
import type { ActivityEntryService } from "#modules/activity/services/activity-entry.service";

const noteId = "not_01ja0000000000000000000001" as PublicId<"not">;

/** One stored entry, with the columns a caller never sees. */
const entry = Object.assign(new ActivityEntry(), {
  id: "act_01ja0000000000000000000003" as PublicId<"act">,
  kind: ActivityKind.NoteUpdated,
  noteId,
  occurredAt: new Date("2026-06-03T00:00:00.000Z"),
  tenantId: "scp_01ja0000000000000000000001",
  createdAt: new Date("2026-06-03T00:00:01.000Z"),
});

/** A service whose table read answers `page` and keeps each read it was asked for. */
function tableOf(page: { hasMore: boolean; nextCursor?: string }) {
  const reads: TableQuery[] = [];
  const entries = {
    table: async (query: TableQuery) => {
      reads.push(query);
      return { items: [entry], ...page };
    },
  } as unknown as ActivityEntryService;
  return { entries, reads };
}

describe(ListActivityQuery, () => {
  it("is the activity_entry.list query for users and agents", () => {
    expect(kindOf(ListActivityQuery)?.options).toMatchObject({
      key: "activity_entry.list",
      actors: [ActorKind.User, ActorKind.Agent],
    });
  });

  it("reads one page with the input's size and answers the next cursor", async () => {
    const { entries, reads } = tableOf({ hasMore: true, nextCursor: "c2" });

    const page = await new ListActivityQuery(entries).handle(
      ListActivityInput.create({ limit: 1 }),
      fakeActionContext() as never,
    );

    expect(reads).toEqual([{ limit: 1 }]);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe("c2");
    expect({ ...page.items[0] }).toEqual({
      id: entry.id,
      kind: ActivityKind.NoteUpdated,
      noteId,
      occurredAt: new Date("2026-06-03T00:00:00.000Z"),
    });
  });

  it("reads after the cursor it was given, and answers none on the last page", async () => {
    const { entries, reads } = tableOf({ hasMore: false });

    const page = await new ListActivityQuery(entries).handle(
      ListActivityInput.create({ limit: 2, cursor: "c2" }),
      fakeActionContext() as never,
    );

    expect(reads).toEqual([{ limit: 2, cursor: "c2" }]);
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeUndefined();
  });
});
