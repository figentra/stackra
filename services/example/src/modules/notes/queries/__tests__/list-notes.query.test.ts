/**
 * Stackra file contract:
 * Purpose: unit tests of `ListNotesQuery`: the `note.list` query reads one row more than the page to know whether another follows, answers newest first, continues after the cursor it handed out, and answers views only.
 * Boundary: test only; the query is called directly with a stand-in note service over an in-memory list and a fake context.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098; ADR 0294 (as amended by programming model v3.1, AGENTS.md).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, type PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Note } from "#modules/notes/models/note.model";
import { ListNotesQuery } from "#modules/notes/queries/list-notes.query";
import { ListNotesInput } from "#modules/notes/schemas/list-notes-input.schema";
import type { NoteService } from "#modules/notes/services/note.service";

/** Three stored notes, oldest first, as the ids sort. */
const stored = [1, 2, 3].map((n) =>
  Object.assign(new Note(), {
    id: `not_01ja000000000000000000000${n}` as PublicId<"not">,
    tenantId: "scp_01ja0000000000000000000009",
    title: `note ${n}`,
    body: "",
    createdAt: new Date(`2026-11-0${n}T00:00:00.000Z`),
    updatedAt: new Date(`2026-11-0${n}T00:00:00.000Z`),
  }),
);

/** A note service whose `find` honours the `$lt` filter, the descending id order and the limit. */
const notes = {
  find: async (where: { id?: { $lt: string } }, options: { limit: number }) =>
    stored
      .filter((note) => where.id === undefined || note.id < where.id.$lt)
      .toReversed()
      .slice(0, options.limit),
} as unknown as NoteService;

/** The note.list query. */
describe(ListNotesQuery, () => {
  /** Its key and actors are what gen derives the route, permission and tool from. */
  it("is the note.list query for users and agents", () => {
    expect(kindOf(ListNotesQuery)?.options).toMatchObject({
      key: "note.list",
      actors: [ActorKind.User, ActorKind.Agent],
    });
  });

  /** Two pages: the first has a cursor, the second is the last. */
  it("pages newest first and continues after the cursor", async () => {
    const query = new ListNotesQuery(notes);
    const context = fakeActionContext() as never;
    const first = await query.handle(ListNotesInput.create({ limit: 2 }), context);
    expect(first.items.map((item) => item.title)).toEqual(["note 3", "note 2"]);
    expect(first.hasMore).toBe(true);
    expect(first.nextCursor).toBe(stored[1]?.id);
    const second = await query.handle(
      ListNotesInput.create({ limit: 2, cursor: first.nextCursor ?? "" }),
      context,
    );
    expect(second.items.map((item) => item.title)).toEqual(["note 1"]);
    expect(second.hasMore).toBe(false);
    expect(second.nextCursor).toBeUndefined();
  });

  /** A page that exactly fits has no next page. */
  it("has no next page when the rows exactly fill the limit", async () => {
    const page = await new ListNotesQuery(notes).handle(
      ListNotesInput.create({ limit: 3 }),
      fakeActionContext() as never,
    );
    expect(page.items).toHaveLength(3);
    expect(page.hasMore).toBe(false);
  });

  /** Views, never rows: the tenant id stays inside the module. */
  it("answers views without the tenant id", async () => {
    const page = await new ListNotesQuery(notes).handle(
      ListNotesInput.create({ limit: 1 }),
      fakeActionContext() as never,
    );
    expect(JSON.stringify(page)).not.toContain("tenantId");
    expect(JSON.stringify(page)).not.toContain("scp_");
  });
});
