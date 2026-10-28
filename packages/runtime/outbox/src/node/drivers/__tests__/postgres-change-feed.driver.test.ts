/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresChangeFeedDriver`: `read` lists only entries older than the snapshot horizon, of the
 *          given models, after a parsed position, every value bound, and reads rows back into records; a bad position
 *          is refused; `positionAt` steps back one from the first entry at the instant, or takes the last one;
 *          `cursor` and `save` round-trip a cursor through one upsert; `maintain` makes tomorrow's partitions on and
 *          drops expired dated ones.
 * Boundary: test only; a stand-in entity manager records each statement and answers by statement, so no database
 *           runs. The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 and ADR 0221 (2026-10-28 amendment); ADR 0160.
 */
import { Duration } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { ChangeFeed } from "#contracts/index";
import { PostgresChangeFeedDriver } from "#node/drivers/postgres-change-feed.driver";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

/** A database whose entity manager records each statement and answers what `answer` gives for it. */
function databaseWith(answer: (sql: string) => readonly object[] = () => []) {
  const statements: Statement[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      return answer(sql);
    },
  };
  return { database: { em: () => em } as unknown as Database, statements };
}

const ROW = {
  tx: "812",
  seq: "40",
  data: { model: "Product", id: "prd_1", kind: "updated", fields: ["name"] },
  meta: { correlationId: "call-1" },
  occurred_at: NOON,
  scope_id: "scp_1",
  scope_path: "platform.acme",
};

describe(PostgresChangeFeedDriver, () => {
  it("is a ChangeFeed", () => {
    expect(new PostgresChangeFeedDriver({} as Database)).toBeInstanceOf(ChangeFeed);
  });

  it("reads committed entries of the models after a position, every value bound", async () => {
    const { database, statements } = databaseWith(() => [ROW]);
    const records = await new PostgresChangeFeedDriver(database).read("812:39", ["Product"], 100);
    const [read] = statements;
    expect(read?.sql).toContain("tx < pg_snapshot_xmin(pg_current_snapshot())");
    expect(read?.sql).toContain("(tx, seq) > (?::xid8, ?::bigint)");
    expect(read?.params).toEqual(['["Product"]', "812", "39", 100]);
    expect(read?.sql.split("?")).toHaveLength(5);
    expect(records).toEqual([
      {
        position: "812:40",
        change: ROW.data,
        meta: { correlationId: "call-1" },
        occurredAt: NOON,
        scope: { id: "scp_1", path: "platform.acme" },
      },
    ]);
  });

  it("reads from the start without a position, nothing for no models, and refuses a foreign position", async () => {
    const { database, statements } = databaseWith();
    const feed = new PostgresChangeFeedDriver(database);
    await feed.read(undefined, ["Product"], 10);
    expect(statements[0]?.sql).not.toContain("(tx, seq) >");
    await expect(feed.read(undefined, [], 10)).resolves.toEqual([]);
    expect(statements).toHaveLength(1);
    await expect(feed.read("evt_A", ["Product"], 10)).rejects.toThrow(TypeError);
  });

  it("positions just before the first entry at an instant, or after the last one", async () => {
    const first = databaseWith((sql) =>
      sql.includes("occurred_at >=") ? [{ tx: "9", seq: 5 }] : [],
    );
    await expect(new PostgresChangeFeedDriver(first.database).positionAt(NOON)).resolves.toBe(
      "9:4",
    );
    const last = databaseWith((sql) => (sql.includes("desc") ? [{ tx: "9", seq: "7" }] : []));
    await expect(new PostgresChangeFeedDriver(last.database).positionAt(NOON)).resolves.toBe("9:7");
    await expect(
      new PostgresChangeFeedDriver(databaseWith().database).positionAt(NOON),
    ).resolves.toBeUndefined();
  });

  it("round-trips a cursor through one upsert", async () => {
    const { database, statements } = databaseWith(() => [
      {
        consumer: "IndexConsumer",
        position: "9:7",
        attempts: 2,
        available_at: NOON,
        last_error: { code: "internal", message: "down" },
        stalled_at: null,
      },
    ]);
    const feed = new PostgresChangeFeedDriver(database);
    await expect(feed.cursor("IndexConsumer")).resolves.toEqual({
      consumer: "IndexConsumer",
      position: "9:7",
      attempts: 2,
      availableAt: NOON,
      lastError: { code: "internal", message: "down" },
    });
    await feed.save({ consumer: "IndexConsumer", attempts: 0, availableAt: NOON });
    const upsert = statements[1];
    expect(upsert?.sql).toContain("on conflict (consumer) do update");
    expect(upsert?.params).toEqual(["IndexConsumer", null, 0, NOON, null, null]);
  });

  it("makes the next days' partitions and drops expired dated ones", async () => {
    const { database, statements } = databaseWith((sql) => {
      if (sql.includes("to_regclass")) return [{ missing: true }];
      if (sql.includes("pg_inherits"))
        return [
          { name: "changes_default" },
          { name: "changes_p20261010" },
          { name: "changes_p20261024" },
        ];
      return [];
    });
    const report = await new PostgresChangeFeedDriver(database).maintain(NOON, Duration.days(7));
    expect(report).toEqual({ created: 3, dropped: 1 });
    const sql = statements.map((statement) => statement.sql);
    expect(sql).toContain(
      "create table if not exists outbox.changes_p20261026 partition of outbox.changes for values from ('2026-10-26T00:00:00.000Z') to ('2026-10-27T00:00:00.000Z')",
    );
    expect(sql).toContain("alter table outbox.changes detach partition outbox.changes_p20261010");
    expect(sql).toContain("drop table outbox.changes_p20261010");
    expect(sql.some((text) => text.includes("changes_p20261024"))).toBe(false);
    expect(sql).toContain("delete from outbox.changes_default where occurred_at < ?");
  });
});
