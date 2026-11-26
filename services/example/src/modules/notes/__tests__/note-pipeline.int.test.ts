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
import { Clock } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { DatabaseUnitOfWorkDriver, PostgresIdempotencyStoreDriver } from "@stackra/database/node";
import { usePostgres } from "@stackra/database/testing";
import { ForbiddenError, NotFoundError } from "@stackra/errors";
import {
  IamAccessControlDriver,
  MemoryPolicySourceDriver,
  PolicyDecisionPointService,
} from "@stackra/iam";
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
function pipelineOf(
  access: AccessControl = new AllowAll(),
  tree: MemoryScopeTreeDriver = new MemoryScopeTreeDriver(),
): ActionPipeline {
  const { database } = postgres;
  const notes = new NoteService();
  const bound = new Map<AnyClass, object>([
    [AccessControl, access],
    [UnitOfWork, new DatabaseUnitOfWorkDriver()],
    [IdempotencyStore, new PostgresIdempotencyStoreDriver(database)],
    [CallIsolation, new CallIsolationDriver(database, new TenantIsolationService(database), tree)],
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
  await em.execute('truncate table "database"."idempotency_keys"');
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

/** The permission step and scope tree of a call; the default allows everything. */
interface Access {
  readonly access: AccessControl;
  readonly tree: MemoryScopeTreeDriver;
}

/** One call of `type` as `actor`, as the service role; `wiring` swaps in a real permission step. */
const call = (type: AnyClass, input: unknown, actor: Actor, wiring?: Access) =>
  asService(() =>
    pipelineOf(wiring?.access, wiring?.tree).execute(type as never, input as never, {
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

  /** A cursor that is not a note id is a client error, refused before the query runs. */
  it("refuses a malformed cursor as invalid input", async () => {
    await call(CreateNoteAction, { title: "one" }, userA);
    for (const cursor of [
      "bogus",
      "not_",
      "usr_01ja0000000000000000000001",
      "not_01ja000000000000000000000!",
    ])
      await expect(call(ListNotesQuery, { cursor }, userA)).rejects.toMatchObject({
        kind: "validation",
      });
    // a well-formed cursor still pages: this one sorts after every id, so the note is on its page
    expect(
      (await call(ListNotesQuery, { cursor: `not_${"z".repeat(26)}` }, userA)).items,
    ).toHaveLength(1);
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

/** A fixed clock for the policy decision point. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-11-24T12:00:00Z");
  }
}

describe("the notes permissions through the pipeline", () => {
  const home = fakeTenantId();
  const scope: ScopeRef = { id: home, path: "platform.alpha" };
  const writer: Actor = { ...tenantActor(home), id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w1" };
  const reader: Actor = { ...tenantActor(home), id: "usr_01j9z3k4m5n6p7q8r9s0t1v2r1" };
  const stranger: Actor = { ...tenantActor(home), id: "usr_01j9z3k4m5n6p7q8r9s0t1v2x1" };

  /** The real permission step: the writer role holds every notes permission, the reader role only read. */
  function real(): Access {
    const source = new MemoryPolicySourceDriver();
    source.load({
      grants: [
        { principal: writer.id, role: "writer", scope },
        { principal: reader.id, role: "reader", scope },
      ],
      roles: {
        writer: ["notes.note.create", "notes.note.read", "notes.note.update", "notes.note.delete"],
        reader: ["notes.note.read"],
      },
    });
    const tree = new MemoryScopeTreeDriver().seed([
      { id: fakeTenantId(), path: "platform", level: "platform", name: "Platform" },
      { ...scope, level: "product", name: "Alpha" },
    ]);
    const pdp = new PolicyDecisionPointService(source, new FixedClockDriver());
    return { access: new IamAccessControlDriver(pdp, tree), tree };
  }

  beforeEach(prepare);

  /** The grant is what lets a write through. */
  it("lets a caller holding notes.note.create create a note", async () => {
    const created = await call(CreateNoteAction, { title: "allowed" }, writer, real());
    expect(created).toMatchObject({ title: "allowed" });
    expect(await storedCount()).toBe(1);
  });

  /** No create permission: refused, and nothing is written (not the row, not the idempotency record). */
  it("refuses a caller without notes.note.create and writes nothing", async () => {
    await expect(
      call(CreateNoteAction, { title: "denied" }, reader, real()),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      call(CreateNoteAction, { title: "denied" }, stranger, real()),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(await storedCount()).toBe(0);
    const [keys] = (await postgres.database
      .em()
      .execute('select count(*)::int as n from "database"."idempotency_keys"')) as { n: number }[];
    expect(keys?.n).toBe(0);
  });

  /** Read is a different permission from write: the reader reads, and cannot update or delete. */
  it("lets a reader read but refuses it update and delete, leaving the note as it was", async () => {
    const note = await call(CreateNoteAction, { title: "kept" }, writer, real());
    expect(await call(GetNoteQuery, { noteId: note["id"] }, reader, real())).toMatchObject({
      title: "kept",
    });
    await expect(
      call(UpdateNoteAction, { noteId: note["id"], title: "changed" }, reader, real()),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      call(DeleteNoteAction, { noteId: note["id"] }, reader, real()),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(await call(GetNoteQuery, { noteId: note["id"] }, writer, real())).toMatchObject({
      title: "kept",
    });
    expect(await storedCount()).toBe(1);
  });

  /** A caller with no grant at all holds nothing, not even read. */
  it("refuses a caller with no grant, even for a read", async () => {
    await expect(call(ListNotesQuery, {}, stranger, real())).rejects.toBeInstanceOf(ForbiddenError);
  });
});
