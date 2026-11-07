/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresDatabaseDriver.transaction` with `requiresNew` on real Postgres under forced
 *          row-level security (STA-2565): opened inside a transaction under tenant A, it runs on another backend with
 *          A's `app.tenant_id`, so its `pending` row takes tenant A from the column default, passes the policy and
 *          stays committed after the outer transaction rolls back, visible under A and not under B. With no tenant in
 *          the caller (or no caller transaction at all) the policy still refuses the insert, as before.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's user is a superuser, which row
 *           security never restricts, so every insert and read runs as `attempt_writer` (`set local role`); the final
 *           tenant check reads as the superuser.
 * Runtime: node (vitest)
 * Governing contract: ADR 0136 (decision 2); ADR 0239 (decision 1); ADR 0327 (decisions 3 and 5); ADR 0182
 *                     (integration tier); ADR 0022.
 */
import { describe, expect, it } from "@stackra/testing";

import { Migration } from "#core/bases/migration.base";
import { compileMigration } from "#core/functions/compile-migration.function";
import type { Blueprint } from "#core/types/blueprint.type";
import type { SchemaBuilder } from "#core/types/schema-builder.type";
import { usePostgres } from "#testing/use-postgres";

const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_7zzzzzzzzzzzzzzzzzzzzzzzzz";

/** The role every insert and read runs as: no `BYPASSRLS`, not the table's owner. */
const ROLE = "attempt_writer";

class CreateAttemptsMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("attempts", (t: Blueprint) => {
      t.link("tenant_id")
        .notNull()
        .defaultSetting("app.tenant_id")
        .comment("The owning tenant, from the transaction.");
      t.string("body").notNull().comment("The attempt's state.");
      t.rowLevelSecurity("tenant_id", { setting: "app.tenant_id", match: "equals" });
    });
  }
}

const postgres = usePostgres({
  migrations: [
    compileMigration(CreateAttemptsMigration, { schema: "ledger", createsSchema: true }),
    {
      after: [],
      steps: [
        {
          transactional: true,
          inverse: false,
          sql: [
            `create role ${ROLE} nologin nobypassrls`,
            `grant usage on schema ledger to ${ROLE}`,
            `grant select, insert on ledger.attempts to ${ROLE}`,
          ],
        },
      ],
    },
  ],
});

/** The backend of the running transaction. */
async function backend(): Promise<number> {
  const [row] = (await postgres.database.em().execute("select pg_backend_pid() as pid")) as {
    pid: number;
  }[];
  return row?.pid ?? -1;
}

/** Sets the tenant `scopeId` for the rest of the running transaction, as `withTenant` writes it. */
async function enter(scopeId: string): Promise<void> {
  await postgres.database.em().execute("select set_config('app.tenant_id', ?, true)", [scopeId]);
}

/** Inserts `body` as the role in a `requiresNew` transaction; returns that transaction's backend. */
function insertOnItsOwn(body: string): Promise<number> {
  const { database } = postgres;
  return database.transaction(
    async () => {
      const em = database.em();
      await em.execute(`set local role ${ROLE}`);
      await em.execute("insert into ledger.attempts (body) values (?)", [body]);
      return backend();
    },
    { requiresNew: true },
  );
}

/** The bodies the role sees under the tenant `scopeId`. */
function bodiesAs(scopeId: string): Promise<readonly string[]> {
  const { database } = postgres;
  return database.transaction(async () => {
    await enter(scopeId);
    const em = database.em();
    await em.execute(`set local role ${ROLE}`);
    const rows = (await em.execute("select body from ledger.attempts order by body")) as {
      body: string;
    }[];
    return rows.map((row) => row.body);
  });
}

describe("transaction with requiresNew under row-level security", () => {
  it("commits a pending row in the caller's tenant even when the caller rolls back", async () => {
    const providerFailed = new Error("provider call failed");
    const backends: { outer?: number; inner?: number } = {};
    await expect(
      postgres.database.transaction(async () => {
        await enter(ACME);
        backends.outer = await backend();
        backends.inner = await insertOnItsOwn("pending");
        throw providerFailed;
      }),
    ).rejects.toBe(providerFailed);
    expect(backends.inner).not.toBe(backends.outer);
    expect(await bodiesAs(ACME)).toEqual(["pending"]);
    expect(await bodiesAs(GLOBEX)).toEqual([]);
    expect(
      await postgres.database
        .em()
        .execute("select tenant_id from ledger.attempts where body = 'pending'"),
    ).toEqual([{ tenant_id: ACME }]);
  });

  it("still refuses the insert when the caller carries no tenant", async () => {
    await expect(postgres.database.transaction(() => insertOnItsOwn("orphan"))).rejects.toThrow(
      /row-level security/,
    );
    await expect(insertOnItsOwn("orphan")).rejects.toThrow(/row-level security/);
    expect(
      await postgres.database
        .em()
        .execute("select body from ledger.attempts where body = 'orphan'"),
    ).toEqual([]);
  });
});
