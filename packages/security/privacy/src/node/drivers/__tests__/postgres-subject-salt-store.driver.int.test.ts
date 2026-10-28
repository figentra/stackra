/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresSubjectSaltStoreDriver` on real Postgres: `obtain` creates a 32-byte salt
 *          once and keeps it, `find` never creates one, `destroy` deletes it once, and salts are partitioned by the
 *          session's tenant (`-` outside one).
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0001 migration creates the table.
 *           Each case runs in a transaction that sets `app.tenant_id`, as a scoped session would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212; ADR 0239; gap gov2 (stackra-263).
 */
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { describe, expect, it } from "@stackra/testing";

import { CreateSubjectSaltsMigration } from "#node/database/migrations/0001-create-subject-salts.migration";
import { PostgresSubjectSaltStoreDriver } from "#node/drivers/postgres-subject-salt-store.driver";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateSubjectSaltsMigration, { schema: "privacy", createsSchema: true }),
  ],
});

/** Runs `work` with a store in a transaction whose `app.tenant_id` is `partition` (none when undefined). */
function inPartition<T>(
  partition: string | undefined,
  work: (store: PostgresSubjectSaltStoreDriver) => Promise<T>,
): Promise<T> {
  const { database } = postgres;
  return database.transaction(async () => {
    const em = database.em() as unknown as {
      execute: (sql: string, params: readonly unknown[]) => Promise<unknown>;
    };
    if (partition !== undefined)
      await em.execute("select set_config('app.tenant_id', ?, true)", [partition]);
    return work(new PostgresSubjectSaltStoreDriver(database));
  });
}

describe(PostgresSubjectSaltStoreDriver, () => {
  it("creates a salt once, finds it, and destroys it once", async () => {
    await inPartition("ten_acme", async (store) => {
      await expect(store.find("usr_1")).resolves.toBeUndefined();
      const salt = await store.obtain("usr_1");
      expect(salt).toHaveLength(32);
      expect(await store.obtain("usr_1")).toEqual(salt);
      expect(await store.find("usr_1")).toEqual(salt);
      await expect(store.destroy("usr_1")).resolves.toBe(true);
      await expect(store.destroy("usr_1")).resolves.toBe(false);
      await expect(store.find("usr_1")).resolves.toBeUndefined();
    });
  });

  it("keeps one salt per tenant, and a partition for a session in no tenant", async () => {
    const acme = await inPartition("ten_acme", (store) => store.obtain("usr_2"));
    const globex = await inPartition("ten_globex", (store) => store.obtain("usr_2"));
    const none = await inPartition(undefined, (store) => store.obtain("usr_2"));
    expect(globex).not.toEqual(acme);
    expect(none).not.toEqual(acme);

    await inPartition("ten_globex", (store) => store.destroy("usr_2"));
    expect(await inPartition("ten_acme", (store) => store.find("usr_2"))).toEqual(acme);
    expect(await inPartition("ten_globex", (store) => store.find("usr_2"))).toBeUndefined();
  });
});
