/**
 * Stackra file contract:
 * Purpose: the example service end to end on its generated wiring: a signed-in user writes, changes and deletes a note
 *          through the real action pipeline; the notes module's integration events leave through the outbox only after
 *          each call committed; the activity module's listeners turn them into the tenant's feed, which the feed query
 *          reads newest first; and the daily retention cron pushes one job per tenant through the queue, whose worker
 *          deletes the entries past their 90 days and keeps the rest.
 * Boundary: unit tier: the testing app is `createTestingModule` over the generated `ExampleModule` and wiring with the
 *           memory drivers (PGlite for the database, memory outbox, queue and scheduler stores). One tenant only:
 *           tenant isolation is proved on Postgres as the NOBYPASSRLS role in `activity-isolation.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (testing helpers); ADR 0078 (decisions 2 to 4: listeners after commit);
 *                     ADR 0148 (decisions 4 and 5: queue and per-scope crons); ADR 0098.
 */
import { run } from "@stackra/actions/testing";
import { createTestingModule } from "@stackra/container/testing";
import { TableCursorInvalidError } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import { drainOutbox } from "@stackra/events/testing";
import { actors, TEST_SCOPE_ID } from "@stackra/iam/testing";
import { drainQueue } from "@stackra/queue/testing";
import type { MemoryCronScopesDriver } from "@stackra/scheduler";
import { CronScopes } from "@stackra/scheduler/contracts";
import { tick } from "@stackra/scheduler/testing";
import { describe, expect, freezeClock, it } from "@stackra/testing";

import { ActivityKind } from "#modules/activity/enums/activity-kind.enum";
import { RecordNoteCreatedListener } from "#modules/activity/listeners/record-note-created.listener";
import { ListActivityQuery } from "#modules/activity/queries/list-activity.query";
import type { ListActivityOutput } from "#modules/activity/schemas/list-activity-output.schema";
import { CreateNoteAction } from "#modules/notes/actions/create-note.action";
import { DeleteNoteAction } from "#modules/notes/actions/delete-note.action";
import { UpdateNoteAction } from "#modules/notes/actions/update-note.action";
import { NoteCreated } from "#modules/notes/events/note-created.event";
import type { NoteView } from "#modules/notes/schemas/note-view.schema";
import { ExampleModule } from "#stackra/module";

/** A member of the test tenant, signed in. */
const ada = actors.staff();

/** The tenant's feed, as Ada reads it. */
async function feed(): Promise<ListActivityOutput["items"]> {
  const page = await run(ListActivityQuery, {}, { as: ada });
  return (page.output as ListActivityOutput).items;
}

/**
 * The example service's testing app on the memory drivers. The relay publishes to the service's own inbox, as a single
 * service deploys (the other candidate, `broker`, is for a fleet): `EventPublisher` has no memory driver to fall to.
 */
async function compile() {
  return createTestingModule(ExampleModule)
    .useDrivers("memory")
    .useDrivers({ EventPublisher: "inbox" })
    .compile();
}

describe("the activity feed of the example service", { timeout: 120_000 }, () => {
  it("records each note change after its call commits, newest first", async () => {
    freezeClock("2026-06-01T09:00:00Z");
    const app = await compile();

    const created = await run(
      CreateNoteAction,
      { title: "Buy milk", body: "Two litres" },
      { as: ada, idempotencyKey: "create-1" },
    );
    const note = created.output as NoteView;
    expect(created).toRecord(NoteCreated, { noteId: note.id });
    expect(await feed()).toEqual([]); // nothing reached the feed inside the call

    await drainOutbox(); // the relay hands the committed event to the listener
    expect(app.listeners.calls(RecordNoteCreatedListener)).toHaveLength(1);
    expect(await feed()).toMatchObject([{ kind: ActivityKind.NoteCreated, noteId: note.id }]);

    await run(UpdateNoteAction, { noteId: note.id, title: "Buy oat milk" }, { as: ada });
    await run(DeleteNoteAction, { noteId: note.id }, { as: ada });
    await drainOutbox();

    const entries = await feed();
    expect(entries.map((entry) => entry.kind)).toEqual([
      ActivityKind.NoteDeleted,
      ActivityKind.NoteUpdated,
      ActivityKind.NoteCreated,
    ]);
    expect(new Set(entries.map((entry) => entry.noteId))).toEqual(new Set([note.id]));
    expect(entries[0]?.occurredAt).toEqual(new Date("2026-06-01T09:00:00Z"));

    // one cursor page at a time, newest first
    const first = (await run(ListActivityQuery, { limit: 2 }, { as: ada }))
      .output as ListActivityOutput;
    expect(first.items.map((entry) => entry.kind)).toEqual([
      ActivityKind.NoteDeleted,
      ActivityKind.NoteUpdated,
    ]);
    expect(first.hasMore).toBe(true);
    const cursor = first.nextCursor ?? "";
    const second = (await run(ListActivityQuery, { limit: 2, cursor }, { as: ada }))
      .output as ListActivityOutput;
    expect(second.items.map((entry) => entry.kind)).toEqual([ActivityKind.NoteCreated]);
    expect(second.hasMore).toBe(false);

    // a cursor no page gave is the caller's error (400), not the server's
    const forged = await run(ListActivityQuery, { cursor: "bogus" }, { as: ada });
    expect(forged.ok).toBe(false);
    expect(isRefusal(forged.error, TableCursorInvalidError)).toBe(true);
  });

  it("records nothing for a call that was refused", async () => {
    const app = await compile();
    const refused = await run(
      CreateNoteAction,
      { title: "" }, // below the title's minimum of 1
      { as: ada, idempotencyKey: "create-refused" },
    );
    expect(refused.ok).toBe(false);
    await drainOutbox();
    expect(app.listeners.calls(RecordNoteCreatedListener)).toHaveLength(0);
    expect(await feed()).toEqual([]);
  });

  it("prunes the entries past their 90 days from the daily cron, through the queue", async () => {
    freezeClock("2026-01-10T12:00:00Z");
    const app = await compile();
    // The tenants a per-scope cron fans out to: tenancy's driver lists the tenant nodes in a deployment; here the test's
    // one tenant, the scope `actors.staff()` acts in.
    (app.get(CronScopes) as MemoryCronScopesDriver).scopes = [
      { id: TEST_SCOPE_ID, path: "platform.test" },
    ];
    const old = await run(
      CreateNoteAction,
      { title: "Old" },
      { as: ada, idempotencyKey: "create-old" },
    );
    await drainOutbox();

    freezeClock("2026-04-20T12:00:00Z"); // 100 days later
    const recent = await run(
      CreateNoteAction,
      { title: "Recent" },
      { as: ada, idempotencyKey: "create-recent" },
    );
    await drainOutbox();
    expect(await feed()).toHaveLength(2);

    // #region cron
    const at = new Date("2026-04-21T03:30:20Z");
    freezeClock(at.toISOString());
    const ticked = await tick(at); // the scheduler pushes one prune job per tenant
    expect(ticked.ran).toBe(true);
    await drainQueue(); // the worker runs it in the tenant's isolation
    // #endregion cron

    expect(await feed()).toMatchObject([
      { kind: ActivityKind.NoteCreated, noteId: (recent.output as NoteView).id },
    ]);
    expect((await feed()).some((entry) => entry.noteId === (old.output as NoteView).id)).toBe(
      false,
    );
  });
});
