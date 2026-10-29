/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresAccountDeletionsDriver` on real Postgres: put, find, replace, remove and the
 *          due list oldest first, and rows partitioned by the session's tenant (null outside one).
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0001 migration creates the table.
 *           Each case runs in a transaction that sets `app.tenant_id`, as a scoped session would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239; STA-1567.
 */
import type { PublicId } from "@stackra/contracts";
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { describe, expect, it } from "@stackra/testing";

import { CreateAccountDeletionsMigration } from "#node/database/migrations/0001-create-account-deletions.migration";
import { PostgresAccountDeletionsDriver } from "#node/drivers/postgres-account-deletions.driver";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateAccountDeletionsMigration, { schema: "identity", createsSchema: true }),
  ],
});

const USER = "usr_1" as PublicId<"usr">;
const OTHER = "usr_2" as PublicId<"usr">;
const AT = new Date("2026-10-29T09:00:00.000Z");
const DUE = new Date("2026-11-28T09:00:00.000Z");
const LATER = new Date("2026-12-28T09:00:00.000Z");

/** Runs `work` with a store in a transaction whose `app.tenant_id` is `partition` (none when undefined). */
function inPartition<T>(
  partition: string | undefined,
  work: (store: PostgresAccountDeletionsDriver) => Promise<T>,
): Promise<T> {
  const { database } = postgres;
  return database.transaction(async () => {
    const em = database.em() as unknown as {
      execute: (sql: string, params: readonly unknown[]) => Promise<unknown>;
    };
    if (partition !== undefined)
      await em.execute("select set_config('app.tenant_id', ?, true)", [partition]);
    return work(new PostgresAccountDeletionsDriver(database));
  });
}

describe(PostgresAccountDeletionsDriver, () => {
  it("puts, replaces, lists the due ones oldest first and removes once", async () => {
    await inPartition("ten_acme", async (store) => {
      await store.put({ subject: USER, erasureId: "era_1", requestedAt: AT, dueAt: LATER });
      await store.put({ subject: USER, erasureId: "era_1", requestedAt: AT, dueAt: DUE });
      await store.put({ subject: OTHER, erasureId: "era_2", requestedAt: AT, dueAt: LATER });
      expect(await store.find(USER)).toEqual({
        subject: USER,
        erasureId: "era_1",
        requestedAt: AT,
        dueAt: DUE,
      });
      expect((await store.due(LATER, 10)).map((d) => d.subject)).toEqual([USER, OTHER]);
      expect((await store.due(DUE, 10)).map((d) => d.subject)).toEqual([USER]);
      expect(await store.due(LATER, 1)).toHaveLength(1);
      await expect(store.remove(USER)).resolves.toBe(true);
      await expect(store.remove(USER)).resolves.toBe(false);
      await expect(store.find(USER)).resolves.toBeUndefined();
    });
  });

  it("keeps each tenant's deletions, and a partition for a session in no tenant", async () => {
    await inPartition("ten_acme", (store) =>
      store.put({
        subject: "usr_3" as PublicId<"usr">,
        erasureId: "era_3",
        requestedAt: AT,
        dueAt: DUE,
      }),
    );
    await inPartition(undefined, (store) =>
      store.put({
        subject: "usr_3" as PublicId<"usr">,
        erasureId: "era_4",
        requestedAt: AT,
        dueAt: DUE,
      }),
    );
    await inPartition(undefined, (store) =>
      store.put({
        subject: "usr_3" as PublicId<"usr">,
        erasureId: "era_4",
        requestedAt: AT,
        dueAt: LATER,
      }),
    );
    expect(
      (await inPartition("ten_acme", (store) => store.find("usr_3" as PublicId<"usr">)))?.erasureId,
    ).toBe("era_3");
    expect(
      (await inPartition(undefined, (store) => store.find("usr_3" as PublicId<"usr">)))?.dueAt,
    ).toEqual(LATER);
    expect(await inPartition("ten_globex", (store) => store.due(LATER, 10))).toEqual([]);
  });
});
