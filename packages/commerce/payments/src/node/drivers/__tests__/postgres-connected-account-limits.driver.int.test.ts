/**
 * Stackra file contract:
 * Purpose: integration tests of `PostgresConnectedAccountLimitsDriver` on real Postgres: a connection with no limits
 *          refuses both questions, a set cap and hold read back, a later set replaces them and both changes stay in
 *          the history, and limits are partitioned by the session's tenant.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers; the compiled 0002 migration creates the
 *           tables. Each case runs in a transaction that sets `app.tenant_id`, as a scoped session would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239; STA-1707.
 */
import { compileMigration } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { refusal } from "@stackra/errors/testing";
import { Money } from "@stackra/money";
import { describe, expect, it } from "@stackra/testing";

import { ConnectedAccountLimitsMissingError } from "#core/errors/connected-account-limits-missing.error";
import { CreateConnectedAccountLimitsMigration } from "#node/database/migrations/0002-create-connected-account-limits.migration";
import { PostgresConnectedAccountLimitsDriver } from "#node/drivers/postgres-connected-account-limits.driver";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateConnectedAccountLimitsMigration, {
      schema: "payments",
      createsSchema: true,
    }),
  ],
});

/** The raw-SQL surface used to read the history. */
type Sql = { execute: (sql: string, params: readonly unknown[]) => Promise<unknown> };

/** Runs `work` with limits in a transaction whose `app.tenant_id` is `partition`. */
function inPartition<T>(
  partition: string,
  work: (limits: PostgresConnectedAccountLimitsDriver, sql: Sql) => Promise<T>,
): Promise<T> {
  const { database } = postgres;
  return database.transaction(async () => {
    const sql = database.em() as unknown as Sql;
    await sql.execute("select set_config('app.tenant_id', ?, true)", [partition]);
    return work(new PostgresConnectedAccountLimitsDriver(database), sql);
  });
}

describe(PostgresConnectedAccountLimitsDriver, () => {
  it("fails closed, then serves the limits set, replaced in place with the history kept", async () => {
    await inPartition("ten_acme", async (limits, sql) => {
      const missing = refusal(ConnectedAccountLimitsMissingError, { connectionId: "conn_1" });
      await expect(limits.cap("conn_1")).rejects.toRefuseWith(missing);
      await expect(limits.payoutHeld("conn_1")).rejects.toRefuseWith(missing);

      await limits.set("conn_1", {
        cap: Money.ofMinor(50_000, "EUR"),
        payoutHeld: true,
        by: "usr_ops",
        reason: "verification pending",
      });
      expect(await limits.cap("conn_1")).toEqual(Money.ofMinor(50_000, "EUR"));
      await expect(limits.payoutHeld("conn_1")).resolves.toBe(true);

      await limits.set("conn_1", {
        cap: null,
        payoutHeld: false,
        by: "usr_ops",
        reason: "verified",
      });
      await expect(limits.cap("conn_1")).resolves.toBeNull();
      await expect(limits.payoutHeld("conn_1")).resolves.toBe(false);

      const history = (await sql.execute(
        'select reason from "payments"."connected_account_limit_changes" where connection_id = ?',
        ["conn_1"],
      )) as readonly { reason: string }[];
      expect(history.map((row) => row.reason).sort()).toEqual(["verification pending", "verified"]);
    });
  });

  it("keeps each tenant's limits apart", async () => {
    await inPartition("ten_one", (limits) =>
      limits.set("conn_2", { cap: null, payoutHeld: false, by: "usr_ops", reason: "verified" }),
    );
    await expect(
      inPartition("ten_two", (limits) => limits.payoutHeld("conn_2")),
    ).rejects.toRefuseWith(refusal(ConnectedAccountLimitsMissingError, { connectionId: "conn_2" }));
  });
});
