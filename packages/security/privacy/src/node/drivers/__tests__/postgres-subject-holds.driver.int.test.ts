/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresSubjectHoldsDriver` on real Postgres: a live hold on a subject's public id
 *          holds it, a released one or a hold on another subject does not, and a hold in one tenant's partition is
 *          invisible to another's and to a session in no tenant.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0002 migration creates the table.
 *           Each case runs in a transaction that sets `app.tenant_id`, as a scoped session would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0134; ADR 0239; STA-1567.
 */
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { describe, expect, it } from "@stackra/testing";

import { CreateLegalHoldsMigration } from "#node/database/migrations/0002-create-legal-holds.migration";
import { PostgresSubjectHoldsDriver } from "#node/drivers/postgres-subject-holds.driver";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateLegalHoldsMigration, { schema: "privacy", createsSchema: true }),
  ],
});

/** The raw-SQL surface of the entity manager. */
type Sql = { execute: (sql: string, params: readonly unknown[]) => Promise<unknown> };

/** Runs `work` in a transaction whose `app.tenant_id` is `partition` (none when undefined). */
function inPartition<T>(
  partition: string | undefined,
  work: (holds: PostgresSubjectHoldsDriver, sql: Sql) => Promise<T>,
): Promise<T> {
  const { database } = postgres;
  return database.transaction(async () => {
    const sql = database.em() as unknown as Sql;
    if (partition !== undefined)
      await sql.execute("select set_config('app.tenant_id', ?, true)", [partition]);
    return work(new PostgresSubjectHoldsDriver(database), sql);
  });
}

/** Places a hold on `recordId` in the session's partition. */
function place(sql: Sql, id: string, recordId: string, releasedAt: Date | null = null) {
  return sql.execute(
    "insert into privacy.legal_holds (id, scope_id, model, record_id, reason, placed_at, released_at) " +
      "values (?, coalesce(nullif(current_setting('app.tenant_id', true), ''), '-'), 'User', ?, 'Matter 1', now(), ?)",
    [id, recordId, releasedAt],
  );
}

describe(PostgresSubjectHoldsDriver, () => {
  it("holds a subject a live hold names, and not a released hold or another subject", async () => {
    await inPartition("ten_acme", async (holds, sql) => {
      await place(sql, "lgh_1", "usr_1");
      await place(sql, "lgh_2", "usr_2", new Date());
      await expect(holds.isHeld("usr_1")).resolves.toBe(true);
      await expect(holds.isHeld("usr_2")).resolves.toBe(false);
      await expect(holds.isHeld("usr_3")).resolves.toBe(false);
    });
  });

  it("answers from the session's partition only", async () => {
    await inPartition("ten_acme", (_holds, sql) => place(sql, "lgh_3", "usr_4"));
    await expect(inPartition("ten_acme", (holds) => holds.isHeld("usr_4"))).resolves.toBe(true);
    await expect(inPartition("ten_globex", (holds) => holds.isHeld("usr_4"))).resolves.toBe(false);
    await expect(inPartition(undefined, (holds) => holds.isHeld("usr_4"))).resolves.toBe(false);
  });
});
