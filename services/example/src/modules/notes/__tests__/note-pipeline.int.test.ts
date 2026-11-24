/**
 * Stackra file contract:
 * Purpose: the notes actions and queries end to end through the real actions pipeline on a real Postgres: create, get,
 *          list (with a cursor), update and delete as a tenant's user, in the tenant's isolation transaction and the
 *          call's own unit of work; input is validated before `handle`; an empty update is refused with its code;
 *          another tenant's note is `not_found` for get, update and delete and stays unchanged; a rolled-back call leaves
 *          no row.
 * Boundary: integration tier (`.int`, `stackra test --tier int`, Docker). The pipeline is the real `ActionPipeline` over
 *           the real `CallIsolationDriver` and `DatabaseUnitOfWorkDriver`; access control is a stand-in that allows every call, and the idempotency store is the real Postgres one
 *           (the permission step is IAM's own test, and the derived permission keys are asserted from the manifest in the
 *           unit tier). Every call runs as the NOBYPASSRLS service role, so row-level security decides what is visible.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (test tiers); ADR 0098 (actions are the unit); ADR 0138
 *                     (the pipeline); ADR 0239.
 */
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { ActionPipeline } from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import {
  AccessControl,
  CallIsolation,
  IdempotencyStore,
  UnitOfWork,
} from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import type { Actor } from "@stackra/contracts";
import { DatabaseUnitOfWorkDriver, PostgresIdempotencyStoreDriver } from "@stackra/database/node";
import { usePostgres } from "@stackra/database/testing";
import { NotFoundError } from "@stackra/errors";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import { CallIsolationDriver, TenantIsolationService } from "@stackra/tenancy/node";
import { fakeTenantId, tenantActor, tenantIsolationOptions } from "@stackra/tenancy/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { CreateNoteAction } from "#modules/notes/actions/create-note.action";
import { DeleteNoteAction } from "#modules/notes/actions/delete-note.action";
import { UpdateNoteAction } from "#modules/notes/actions/update-note.action";
import { EmptyNoteUpdateError } from "#modules/notes/errors/empty-note-update.error";
import { GetNoteQuery } from "#modules/notes/queries/get-note.query";
import { ListNotesQuery } from "#modules/notes/queries/list-notes.query";
import { NoteService } from "#modules/notes/services/note.service";

const postgres = usePostgres({
  migrationsDirectory: fileURLToPath(new URL("../../../../.stackra/migrations", import.meta.url)),
});

/** The role the service connects as: no superuser, no BYPASSRLS, so the policies decide. */
const { role } = tenantIsolationOptions();

/** Allows every call: the permission step is not what these tests prove. */
class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

/** A pipeline over the real isolation driver and unit of work, with the note classes bound to one `NoteService`. */
function pipelineOf(): ActionPipeline {
  const { database } = postgres;
  const notes = new NoteService();
  const bound = new Map<AnyClass, object>([
    [AccessControl, new AllowAll()],
    [UnitOfWork, new DatabaseUnitOfWorkDriver()],
    [IdempotencyStore, new PostgresIdempotencyStoreDriver(database)],
    [
      CallIsolation,
      new CallIsolationDriver(
        database,
        new TenantIsolationService(database),
        new MemoryScopeTreeDriver(),
      ),
    ],
    [CreateNoteAction, new CreateNoteAction(notes)],
    [UpdateNoteAction, new UpdateNoteAction(notes)],
    [DeleteNoteAction, new DeleteNoteAction(notes)],
    [GetNoteQuery, new GetNoteQuery(notes)],
    [ListNotesQuery, new ListNotesQuery(notes)],
  ]);
  const resolver: Resolver = {
    has: (type) => bound.has(type),
    get: <U extends object>(type: AnyClass<U>) => bound.get(type) as U,
  };
  return new ActionPipeline(resolver);
}

/** Runs `work` as the service role, in one transaction the pipeline's own unit of work joins. */
function asService<T>(work: () => Promise<T>): Promise<T> {
  return postgres.database.transaction(async () => {
    await postgres.database.em().execute(`set local role "${role}"`);
    return work();
  });
}

/** Empties the table, then gives the service role (no login, no BYPASSRLS) the schema's table. */
async function prepare(): Promise<void> {
  const em = postgres.database.em();
  await em.execute('truncate table "notes"."notes" cascade');
  await em.execute(
    `do $$ begin if not exists (select 1 from pg_roles where rolname = '${role}') then create role "${role}" nologin nobypassrls; end if; end $$`,
  );
  await em.execute(`grant usage on schema "notes" to "${role}"`);
  await em.execute(
    `grant select, insert, update, delete on all tables in schema "notes" to "${role}"`,
  );
  // the real idempotency store's table, which the pipeline writes in the call's transaction
  await em.execute(`grant usage on schema "database" to "${role}"`);
  await em.execute(
    `grant select, insert, update, delete on all tables in schema "database" to "${role}"`,
  );
}

/** How many notes are really stored, read as the container's user (bypasses row security). */
async function storedCount(): Promise<number> {
  const [row] = (await postgres.database
    .em()
    .execute('select count(*)::int as n from "notes"."notes"')) as { n: number }[];
  return row?.n ?? 0;
}

/** One call of `type` as `actor`, as the service role. */
const call = (type: AnyClass, input: unknown, actor: Actor) =>
  asService(() =>
    pipelineOf().execute(type as never, input as never, {
      actor,
      ...(type === CreateNoteAction ? { idempotencyKey: randomUUID() } : {}),
    }),
  ) as Promise<Record<string, unknown> & { items?: Record<string, unknown>[] }>;

describe("the notes actions through the pipeline", () => {
  const a = fakeTenantId();
  const b = fakeTenantId();
  const userA: Actor = tenantActor(a);
  const userB: Actor = tenantActor(b);

  beforeEach(prepare);

  /** The whole life of a note, as its tenant. */
  it("creates, reads, lists, updates and deletes a note as its tenant", async () => {
    const created = await call(CreateNoteAction, { title: "Buy milk", body: "Two litres" }, userA);
    expect(created).toMatchObject({ title: "Buy milk", body: "Two litres" });
    expect(String(created["id"])).toMatch(/^not_/);

    const got = await call(GetNoteQuery, { noteId: created["id"] }, userA);
    expect(got).toMatchObject({ id: created["id"], title: "Buy milk" });

    const listed = await call(ListNotesQuery, {}, userA);
    expect(listed.items?.map((item) => item["id"])).toEqual([created["id"]]);

    const updated = await call(
      UpdateNoteAction,
      { noteId: created["id"], title: "Buy oat milk" },
      userA,
    );
    expect(updated).toMatchObject({ title: "Buy oat milk", body: "Two litres" });
    expect(new Date(String(updated["updatedAt"])).getTime()).toBeGreaterThanOrEqual(
      new Date(String(created["updatedAt"])).getTime(),
    );

    await expect(call(DeleteNoteAction, { noteId: created["id"] }, userA)).resolves.toEqual({
      id: created["id"],
    });
    await expect(call(GetNoteQuery, { noteId: created["id"] }, userA)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(await storedCount()).toBe(0);
  });

  /** A cursor page walks the tenant's notes, newest first. */
  it("lists newest first, one cursor page at a time", async () => {
    for (const title of ["one", "two", "three"]) await call(CreateNoteAction, { title }, userA);
    const first = await call(ListNotesQuery, { limit: 2 }, userA);
    expect(first.items?.map((item) => item["title"])).toEqual(["three", "two"]);
    expect(first["hasMore"]).toBe(true);
    const second = await call(ListNotesQuery, { limit: 2, cursor: first["nextCursor"] }, userA);
    expect(second.items?.map((item) => item["title"])).toEqual(["one"]);
    expect(second["hasMore"]).toBe(false);
  });

  /** Another tenant's note does not exist for tenant B, through every action and query. */
  it("shows tenant B nothing of tenant A's note, and leaves it unchanged", async () => {
    const note = await call(CreateNoteAction, { title: "private" }, userA);
    expect((await call(ListNotesQuery, {}, userB)).items).toEqual([]);
    await expect(call(GetNoteQuery, { noteId: note["id"] }, userB)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      call(UpdateNoteAction, { noteId: note["id"], title: "hijacked" }, userB),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(call(DeleteNoteAction, { noteId: note["id"] }, userB)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(await call(GetNoteQuery, { noteId: note["id"] }, userA)).toMatchObject({
      title: "private",
    });
  });

  /** The tenant is the caller's, never the input's. */
  it("stores a created note under the caller's tenant", async () => {
    await call(CreateNoteAction, { title: "mine" }, userB);
    const [row] = (await postgres.database
      .em()
      .execute('select tenant_id as owner from "notes"."notes"')) as { owner: string }[];
    expect(row?.owner).toBe(b);
  });

  /** Input is validated before `handle`: nothing is written. */
  it("refuses an invalid input before anything is written", async () => {
    await expect(call(CreateNoteAction, { title: "" }, userA)).rejects.toMatchObject({
      kind: "validation",
    });
    await expect(call(CreateNoteAction, { title: "x".repeat(121) }, userA)).rejects.toMatchObject({
      kind: "validation",
    });
    await expect(
      call(CreateNoteAction, { title: "ok", body: "y".repeat(2001) }, userA),
    ).rejects.toMatchObject({ kind: "validation" });
    expect(await storedCount()).toBe(0);
  });

  /** A create without its key is refused: a retry must never add a second note. */
  it("refuses a create without an Idempotency-Key", async () => {
    const refusal = await asService(() =>
      pipelineOf().execute(CreateNoteAction, { title: "no key" } as never, { actor: userA }),
    ).catch((error: unknown) => error);
    expect((refusal as { code?: string }).code).toBe("idempotency_key_required");
    expect(await storedCount()).toBe(0);
  });

  /** An update that changes nothing is its own refusal, with its own code. */
  it("refuses an update that names no field, with the empty_note_update code", async () => {
    const note = await call(CreateNoteAction, { title: "keep" }, userA);
    const refusal = await call(UpdateNoteAction, { noteId: note["id"] }, userA).catch(
      (error: unknown) => error,
    );
    expect(refusal).toBeInstanceOf(EmptyNoteUpdateError);
    expect((refusal as EmptyNoteUpdateError).code).toBe("empty_note_update");
  });

  /** A call that fails after its write rolls the write back. */
  it("rolls back the write of a call that fails", async () => {
    const note = await call(CreateNoteAction, { title: "stays" }, userA);
    await expect(
      call(UpdateNoteAction, { noteId: "not_01ja0000000000000000000099", title: "x" }, userA),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(await call(GetNoteQuery, { noteId: note["id"] }, userA)).toMatchObject({
      title: "stays",
    });
    expect(await storedCount()).toBe(1);
  });
});
