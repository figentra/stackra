/**
 * Stackra file contract:
 * Purpose: tenant isolation of the activity module on a real Postgres, as the NOBYPASSRLS service role: an entry the
 *          listener records in a tenant's delivery carries that tenant; each tenant's feed holds only its own entries; the
 *          retention job run in one tenant deletes only that tenant's old entries and keeps every other tenant's, old or
 *          not; a read with no tenant returns nothing; and the table's policy is enabled and forced.
 * Boundary: integration tier (`.int`, `stackra test --tier int`, Docker). Each call under test runs as the service role
 *           (`set local role`) inside `TenantIsolationService.withTenant`, which is what the inbox's delivery and the
 *           queue worker do for the event's or the job's tenant. The migrations are the compiled files gen writes for
 *           this member.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (test tiers); ADR 0239 (decisions 1 and 3); `.agents/rules/tenancy.md`
 *                     (points 7 and 8); skill security-tenancy-isolation-test.
 */
import { fileURLToPath } from "node:url";

import { fakeActionContext } from "@stackra/actions/testing";
import type { Actor, PublicId } from "@stackra/contracts";
import { usePostgres } from "@stackra/database/testing";
import type { ListenerContext } from "@stackra/events";
import { TenantIsolationService } from "@stackra/tenancy/node";
import { fakeTenantId, tenantActor, tenantIsolationOptions } from "@stackra/tenancy/testing";
import { beforeEach, describe, expect, freezeClock, it } from "@stackra/testing";

import { PruneActivityAction } from "#modules/activity/actions/prune-activity.action";
import { ActivityKind } from "#modules/activity/enums/activity-kind.enum";
import { RecordNoteCreatedListener } from "#modules/activity/listeners/record-note-created.listener";
import { PruneActivityInput } from "#modules/activity/schemas/prune-activity-input.schema";
import { ActivityEntryService } from "#modules/activity/services/activity-entry.service";
import { NoteCreated } from "#modules/notes/events/note-created.event";

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

/** Every stored entry as `note@owner`, read as the container's user (bypasses row security). */
async function stored(): Promise<string[]> {
  const rows = (await postgres.database
    .em()
    .execute(
      'select note_id, tenant_id as owner from "activity"."activity_entries" order by note_id, owner',
    )) as { note_id: string; owner: string }[];
  return rows.map((row) => `${row.note_id}@${row.owner}`);
}

/** Empties the table, then gives the service role (no login, no BYPASSRLS) the schema's table. */
async function prepare(): Promise<void> {
  const em = postgres.database.em();
  await em.execute('truncate table "activity"."activity_entries"');
  await em.execute(
    `do $$ begin if not exists (select 1 from pg_roles where rolname = '${role}') then create role "${role}" nologin nobypassrls; end if; end $$`,
  );
  await em.execute(`grant usage on schema "activity" to "${role}"`);
  await em.execute(
    `grant select, insert, update, delete on all tables in schema "activity" to "${role}"`,
  );
}

/** The note id `n`. */
const note = (n: number) => `not_01ja000000000000000000000${n}` as PublicId<"not">;

/** The context of a delivery of an event that happened at `occurredAt`. */
const deliveryAt = (occurredAt: string): ListenerContext => ({
  eventId: `evt_${occurredAt}`,
  occurredAt: new Date(occurredAt),
  now: () => new Date(occurredAt),
  audit: () => undefined,
});

describe("activity tenant isolation", () => {
  const a = fakeTenantId();
  const b = fakeTenantId();
  const entries = new ActivityEntryService();
  const listener = new RecordNoteCreatedListener(entries);

  /** Delivers `NoteCreated` for note `n`, which happened at `at`, in the delivery of `owner`'s event. */
  const deliver = (owner: ReturnType<typeof fakeTenantId>, n: number, at: string) =>
    asOwner(tenantActor(owner), () =>
      listener.handle(NoteCreated.create({ noteId: note(n) }), deliveryAt(at)),
    );

  beforeEach(async () => {
    await prepare();
    await deliver(a, 1, "2026-01-10T12:00:00Z"); // old
    await deliver(a, 2, "2026-04-20T12:00:00Z"); // recent
    await deliver(b, 3, "2026-01-10T12:00:00Z"); // old, another tenant
  });

  it("stores each entry under the tenant of the delivery that recorded it", async () => {
    expect(await stored()).toEqual([`${note(1)}@${a}`, `${note(2)}@${a}`, `${note(3)}@${b}`]);
  });

  it("shows each tenant only its own feed", async () => {
    const seenByA = await asOwner(tenantActor(a), () => entries.find({}));
    const seenByB = await asOwner(tenantActor(b), () => entries.find({}));
    expect(seenByA.map((entry) => entry.noteId).toSorted()).toEqual([note(1), note(2)]);
    expect(seenByB.map((entry) => [entry.noteId, entry.kind])).toEqual([
      [note(3), ActivityKind.NoteCreated],
    ]);
  });

  it("prunes only the running tenant's old entries", async () => {
    freezeClock("2026-04-21T03:30:00Z");
    const job = new PruneActivityAction(entries);
    const output = await asOwner(tenantActor(a), () =>
      job.handle(PruneActivityInput.create({ keepDays: 90 }), fakeActionContext()),
    );
    expect(output.deleted).toBe(1);
    // tenant B's old entry is not tenant A's to delete, though it is past the same cutoff
    expect(await stored()).toEqual([`${note(2)}@${a}`, `${note(3)}@${b}`]);
  });

  it("returns no entry without a tenant", async () => {
    // No withTenant on purpose: app.tenant_id is unset, so the policy matches nothing.
    expect(await asService(() => entries.find({}))).toHaveLength(0);
  });

  it("has row-level security enabled and forced on the table", async () => {
    const [row] = (await postgres.database
      .em()
      .execute(
        "select relrowsecurity as enabled, relforcerowsecurity as forced from pg_class where oid = 'activity.activity_entries'::regclass",
      )) as { enabled: boolean; forced: boolean }[];
    expect(row).toEqual({ enabled: true, forced: true });
  });
});
