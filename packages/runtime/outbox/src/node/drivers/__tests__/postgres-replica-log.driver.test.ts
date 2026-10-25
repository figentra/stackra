/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresReplicaLogDriver`: it is the `ReplicaLog` port; an append locks the partition, reads
 *          the head and inserts the batch numbered after it with the scope; a read refuses a position above the head
 *          or below what is kept, filters by the caller's scope path when it has one, and reports the next position and
 *          whether more follow.
 * Boundary: test only; a stand-in entity manager answers the bounds and rows a test sets, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0338 (decision 3); ADR 0160.
 */
import { ReplicaLog } from "@stackra/actions/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { PostgresReplicaLogDriver } from "#node/drivers/postgres-replica-log.driver";

/** A database whose partition has `head` and `first`, and whose range read answers `rows`. */
function database(head: number, first: number, rows: readonly object[] = []) {
  const statements: { sql: string; params: readonly unknown[] }[] = [];
  const db = {
    em: () => ({
      execute: async (sql: string, params: readonly unknown[] = []) => {
        statements.push({ sql, params });
        if (sql.includes("max(position)")) return [{ head: String(head), first: String(first) }];
        if (sql.startsWith("select position")) return rows;
        return [];
      },
    }),
  } as unknown as Database;
  return { db, statements };
}

const SCOPE = { id: "scp_1" as const, path: "platform.acme.le_sa" };

describe(PostgresReplicaLogDriver, () => {
  it("appends a batch after the head under the partition's lock", async () => {
    const { db, statements } = database(4, 1);
    const log = new PostgresReplicaLogDriver(db);
    expect(log).toBeInstanceOf(ReplicaLog);
    const at = new Date("2026-10-25T09:00:00.000Z");
    const head = await log.append(
      "sales.sale.recent@1|le_sa",
      [{ id: "sal_1", row: { id: "sal_1", at, data: { total: 10 } } }, { id: "sal_2" }],
      SCOPE,
    );
    expect(head).toBe(6);
    expect(statements[0]?.sql).toContain("pg_advisory_xact_lock");
    const insert = statements.at(-1);
    expect(insert?.params.slice(0, 4)).toEqual([
      "sales.sale.recent@1|le_sa",
      4,
      "scp_1",
      SCOPE.path,
    ]);
    expect(JSON.parse(String(insert?.params[4]))).toEqual([
      { id: "sal_1", row: { id: "sal_1", at: at.toISOString(), data: { total: 10 } } },
      { id: "sal_2", row: null },
    ]);
  });

  it("refuses a position above the head or below what is kept", async () => {
    expect(
      await new PostgresReplicaLogDriver(database(4, 1).db).read("p", 5, 10, undefined),
    ).toBeUndefined();
    expect(
      await new PostgresReplicaLogDriver(database(9, 5).db).read("p", 2, 10, undefined),
    ).toBeUndefined();
  });

  it("reads within the caller's scope and reports the next position", async () => {
    const { db, statements } = database(10, 1, [
      {
        position: 3,
        record_id: "sal_1",
        row: { id: "sal_1", at: "2026-10-25T09:00:00.000Z", data: 1 },
      },
      { position: 5, record_id: "sal_2", row: null },
    ]);
    const read = await new PostgresReplicaLogDriver(db).read("p", 2, 2, SCOPE);
    expect(read).toEqual({
      changes: [
        { id: "sal_1", row: { id: "sal_1", at: new Date("2026-10-25T09:00:00.000Z"), data: 1 } },
        { id: "sal_2" },
      ],
      position: 5,
      more: true,
    });
    expect(statements.at(-1)?.sql).toContain("scope_path <@ ?::ltree");
    expect(statements.at(-1)?.params).toEqual(["p", 2, SCOPE.path, 2]);
  });

  it("reaches the head when fewer rows than the limit are visible", async () => {
    const read = await new PostgresReplicaLogDriver(database(10, 1).db).read("p", 0, 50, undefined);
    expect(read).toEqual({ changes: [], position: 10, more: false });
  });
});
