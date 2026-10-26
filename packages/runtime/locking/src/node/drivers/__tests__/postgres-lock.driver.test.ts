/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresLockDriver`: `within` joins a running transaction and opens one only when none runs;
 *          `tryAcquire` takes one transaction-level advisory lock per key in the given order, every key bound as a
 *          parameter, stops at the first busy key, and only when every key was taken writes each key's
 *          `locking.lock_tokens` row (keys bound) and then reads the fencing token from the WAL insert position, with
 *          no sequence; renewal and release send nothing.
 * Boundary: test only; a stand-in entity manager records each statement and answers from fixed rows, so no database
 *           runs. The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0149 (decisions 1 to 3); ADR 0160.
 */
import { Duration } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { LockDriver } from "#contracts/index";
import { PostgresLockDriver } from "#node/drivers/postgres-lock.driver";

const TTL = Duration.seconds(5);

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

/** A database whose entity manager reports `inTransaction`, refuses the keys in `busy` and draws token `"7"`. */
function databaseWith(options: { inTransaction: boolean; busy?: readonly string[] }) {
  const statements: Statement[] = [];
  const transactions: number[] = [];
  const em = {
    isInTransaction: () => options.inTransaction,
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      if (sql.includes("pg_current_wal_insert_lsn")) return [{ token: "7" }];
      if (sql.startsWith("insert")) return [];
      return [{ held: !(options.busy ?? []).includes(String(params[0])) }];
    },
  };
  const database = {
    em: () => em,
    transaction: async <T>(work: () => Promise<T>): Promise<T> => {
      transactions.push(transactions.length + 1);
      return work();
    },
  } as unknown as Database;
  return { database, statements, transactions };
}

describe(PostgresLockDriver, () => {
  it("is a LockDriver", () => {
    expect(new PostgresLockDriver({} as Database)).toBeInstanceOf(LockDriver);
  });

  it("joins the running transaction", async () => {
    const { database, transactions } = databaseWith({ inTransaction: true });
    await expect(new PostgresLockDriver(database).within(async () => "ran")).resolves.toBe("ran");
    expect(transactions).toEqual([]);
  });

  it("opens a transaction when none runs", async () => {
    const { database, transactions } = databaseWith({ inTransaction: false });
    await expect(new PostgresLockDriver(database).within(async () => "ran")).resolves.toBe("ran");
    expect(transactions).toEqual([1]);
  });

  it("takes an advisory lock per key, every key bound, then draws the token", async () => {
    const { database, statements } = databaseWith({ inTransaction: true });
    const lease = await new PostgresLockDriver(database).tryAcquire(
      ["inventory.stock_level:var_1", "inventory.stock_level:var_2"],
      "owner-1",
      TTL,
    );
    expect(lease).toEqual({
      keys: ["inventory.stock_level:var_1", "inventory.stock_level:var_2"],
      owner: "owner-1",
      token: 7,
    });
    expect(statements).toEqual([
      {
        sql: "select pg_try_advisory_xact_lock(hashtextextended(?, 0)) as held",
        params: ["inventory.stock_level:var_1"],
      },
      {
        sql: "select pg_try_advisory_xact_lock(hashtextextended(?, 0)) as held",
        params: ["inventory.stock_level:var_2"],
      },
      {
        sql:
          "insert into locking.lock_tokens (lock_key, leased_at) values (?, now()), (?, now()) " +
          "on conflict (lock_key) do update set leased_at = excluded.leased_at",
        params: ["inventory.stock_level:var_1", "inventory.stock_level:var_2"],
      },
      {
        sql: "select (pg_current_wal_insert_lsn() - '0/0'::pg_lsn)::bigint as token",
        params: [],
      },
    ]);
    expect(statements.some((statement) => /sequence|nextval/i.test(statement.sql))).toBe(false);
    for (const statement of statements) {
      expect(statement.sql.split("?")).toHaveLength(statement.params.length + 1);
      expect(statement.sql).not.toContain("inventory");
    }
  });

  it("stops at the first busy key, writing no row and drawing no token", async () => {
    const { database, statements } = databaseWith({ inTransaction: true, busy: ["b"] });
    await expect(
      new PostgresLockDriver(database).tryAcquire(["a", "b", "c"], "owner-1", TTL),
    ).resolves.toBeUndefined();
    expect(statements.map((statement) => statement.params)).toEqual([["a"], ["b"]]);
  });

  it("renews and releases without a statement: the locks end with the transaction", async () => {
    const { database, statements } = databaseWith({ inTransaction: true });
    const driver = new PostgresLockDriver(database);
    const lease = { keys: ["a"], owner: "owner-1", token: 7 };
    await expect(driver.renew(lease, TTL)).resolves.toBe(true);
    await expect(driver.release(lease)).resolves.toBeUndefined();
    expect(statements).toEqual([]);
  });
});
