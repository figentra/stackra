/**
 * Stackra file contract:
 * Purpose: tenant isolation of the notes module on a real Postgres, as the NOBYPASSRLS service role: each tenant sees only
 *          its own notes (list, get), tenant B can neither update nor delete tenant A's note and gets `not_found`, never
 *          a permission error, tenant A's rows are unchanged afterwards, a read with no tenant returns nothing, and a row
 *          written under one tenant cannot name another.
 * Boundary: integration tier (`.int`, `stackra test --tier int`, Docker). Rows are arranged as the container's user
 *           (a superuser, which bypasses row security) with one factory call per tenant; every call under test runs as
 *           the service role (`set local role`) inside `TenantIsolationService.withTenant`, which is what the pipeline
 *           does. The migrations are the compiled files gen writes for this member.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (test tiers); ADR 0239 (decisions 1 and 3); `.agents/rules/
 *                     tenancy.md` (points 7 and 8); skill security-tenancy-isolation-test.
 */
import { fileURLToPath } from "node:url";

import type { Actor } from "@stackra/contracts";
import { usePostgres } from "@stackra/database/testing";
import { NotFoundError } from "@stackra/errors";
import { TenantIsolationService } from "@stackra/tenancy/node";
import {
  fakeTenantId,
  runAsTenant,
  tenantActor,
  tenantIsolationOptions,
} from "@stackra/tenancy/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { NoteFactory } from "#modules/notes/database/factories/note.factory";
import type { Note } from "#modules/notes/models/note.model";
import { NoteService } from "#modules/notes/services/note.service";

const postgres = usePostgres({
  migrationsDirectory: fileURLToPath(new URL("../../../../.stackra/migrations", import.meta.url)),
});

/** The role the service connects as: no superuser, no BYPASSRLS, so the policies decide. */
const { role } = tenantIsolationOptions();

/** Runs `work` as the service role, in one transaction. */
function asService<T>(work: () => Promise<T>): Promise<T> {
  return postgres.database.transaction(async () => {
    await postgres.database.em().execute(`set local role "${role}"`);
    return work();
  });
}

/** Runs `work` as the service role under the tenant the service sets for `actor`. */
function asOwner<T>(actor: Actor, work: () => Promise<T>): Promise<T> {
  const tenancy = new TenantIsolationService(postgres.database);
  return asService(() => tenancy.withTenant(actor, work));
}

/** Every note of the table, read as the container's user (bypasses row security): what is really stored. */
async function stored(): Promise<{ title: string; owner: string }[]> {
  return (await postgres.database
    .em()
    .execute('select title, tenant_id as owner from "notes"."notes" order by title')) as {
    title: string;
    owner: string;
  }[];
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
}

describe("notes tenant isolation", () => {
  const a = fakeTenantId();
  const b = fakeTenantId();
  const notes = new NoteService();
  let aliceFirst: Note;

  beforeEach(async () => {
    await prepare();
    // Arranged as the container's user; each row names its own tenant.
    aliceFirst = await runAsTenant(a, () =>
      NoteFactory.new().create({ tenantId: a, title: "a-first" }),
    );
    await runAsTenant(a, () => NoteFactory.new().create({ tenantId: a, title: "a-second" }));
    await runAsTenant(b, () => NoteFactory.new().create({ tenantId: b, title: "b-only" }));
  });

  /** The list of each tenant holds its own rows and no other. */
  it("lists each tenant only its own notes", async () => {
    const seenByA = await asOwner(tenantActor(a), () => notes.find({}));
    const seenByB = await asOwner(tenantActor(b), () => notes.find({}));
    expect(seenByA.map((note) => note.title).toSorted()).toEqual(["a-first", "a-second"]);
    expect(seenByB.map((note) => note.title)).toEqual(["b-only"]);
    expect(seenByB.every((note) => note.tenantId === b)).toBe(true);
  });

  /** A get of another tenant's id is not found, as if the row did not exist. */
  it("gets another tenant's note as not found, and its own as found", async () => {
    await expect(
      asOwner(tenantActor(b), () => notes.findOneOrFail({ id: aliceFirst.id })),
    ).rejects.toBeInstanceOf(NotFoundError);
    const own = await asOwner(tenantActor(a), () => notes.findOneOrFail({ id: aliceFirst.id }));
    expect(own.title).toBe("a-first");
  });

  /** An update by tenant B of A's id is not found and changes nothing. */
  it("cannot update another tenant's note, and leaves it unchanged", async () => {
    await expect(
      asOwner(tenantActor(b), () => notes.update({ id: aliceFirst.id }, { title: "hijacked" })),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect((await stored()).map((row) => row.title)).toEqual(["a-first", "a-second", "b-only"]);
  });

  /** A delete by tenant B of A's id is not found and removes nothing. */
  it("cannot delete another tenant's note, and leaves it in place", async () => {
    await expect(asOwner(tenantActor(b), () => notes.delete({ id: aliceFirst.id }))).resolves.toBe(
      0,
    );
    expect(await stored()).toHaveLength(3);
    // its own tenant's delete does remove it
    await expect(asOwner(tenantActor(a), () => notes.delete({ id: aliceFirst.id }))).resolves.toBe(
      1,
    );
    expect((await stored()).map((row) => row.title)).toEqual(["a-second", "b-only"]);
  });

  /** A read with no tenant set matches nothing: the policy, not a filter, is what hides the rows. */
  it("returns no row without a tenant", async () => {
    // No withTenant on purpose: app.tenant_id is unset, so the policy matches nothing.
    expect(await asService(() => notes.find({}))).toHaveLength(0);
  });

  /** A write cannot name another tenant: the row policy's check refuses it. */
  it("refuses a row written under one tenant that names another", async () => {
    await expect(
      asOwner(tenantActor(b), () =>
        postgres.database
          .em()
          .execute(
            `insert into "notes"."notes" (id, tenant_id, title, body) values (gen_random_uuid(), '${a}', 'forged', '')`,
          ),
      ),
    ).rejects.toThrow();
    expect(await stored()).toHaveLength(3);
  });

  /** The policy is forced, so even the table's owner reads nothing without a tenant. */
  it("has row-level security enabled and forced on the table", async () => {
    const [row] = (await postgres.database
      .em()
      .execute(
        "select relrowsecurity as enabled, relforcerowsecurity as forced from pg_class where oid = 'notes.notes'::regclass",
      )) as { enabled: boolean; forced: boolean }[];
    expect(row).toEqual({ enabled: true, forced: true });
  });
});
