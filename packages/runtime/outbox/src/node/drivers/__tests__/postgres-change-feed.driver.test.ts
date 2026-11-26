/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresChangeFeedDriver`: `claim` calls `outbox.claim_changes` with the models and a
 *          parsed position bound and reads back positions and owners; `load` reads the claimed positions back into
 *          records; a bad position is refused; `positionAt` reads `outbox.change_position_at` and steps back one from
 *          the first entry at the instant, or takes the last one; `cursor` and `save` round-trip a cursor through one
 *          upsert; `maintain` makes tomorrow's partitions on, secures each new one with the log's policies and drops
 *          expired dated ones; `expired` claims default-partition rows and `remove` deletes positions.
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

  it("claims committed entries of every owner after a position through the system function", async () => {
    const { database, statements } = databaseWith(() => [
      { tx: "812", seq: "40", tenant_id: "scp_acme" },
      { tx: "812", seq: 41, tenant_id: null },
    ]);
    const claims = await new PostgresChangeFeedDriver(database).claim("812:39", ["Product"], 100);
    const [claim] = statements;
    expect(claim?.sql).toBe(
      "select tx::text as tx, seq, tenant_id from outbox.claim_changes(?::xid8, ?::bigint, ?::jsonb, ?::integer)",
    );
    expect(claim?.params).toEqual(["812", "39", '["Product"]', 100]);
    expect(claims).toEqual([{ position: "812:40", ownerId: "scp_acme" }, { position: "812:41" }]);
  });

  it("claims from the start without a position, nothing for no models, and refuses a foreign position", async () => {
    const { database, statements } = databaseWith();
    const feed = new PostgresChangeFeedDriver(database);
    await feed.claim(undefined, ["Product"], 10);
    expect(statements[0]?.params).toEqual([null, null, '["Product"]', 10]);
    await expect(feed.claim(undefined, [], 10)).resolves.toEqual([]);
    expect(statements).toHaveLength(1);
    await expect(feed.claim("evt_A", ["Product"], 10)).rejects.toThrow(TypeError);
    await expect(feed.load(["evt_A"])).rejects.toThrow(TypeError);
  });

  it("loads the claimed positions under the caller's row-level security, in log order", async () => {
    const { database, statements } = databaseWith(() => [ROW]);
    const feed = new PostgresChangeFeedDriver(database);
    const records = await feed.load(["812:40"]);
    expect(statements[0]?.sql).toContain(
      "join jsonb_to_recordset(?::jsonb) as p(tx text, seq bigint) on c.tx = p.tx::xid8 and c.seq = p.seq",
    );
    expect(statements[0]?.params).toEqual([JSON.stringify([{ tx: "812", seq: "40" }])]);
    expect(records).toEqual([
      {
        position: "812:40",
        change: ROW.data,
        meta: { correlationId: "call-1" },
        occurredAt: NOON,
        scope: { id: "scp_1", path: "platform.acme" },
      },
    ]);
    await expect(feed.load([])).resolves.toEqual([]);
    expect(statements).toHaveLength(1);
  });

  it("positions just before the first entry at an instant, or after the last one, across owners", async () => {
    const first = databaseWith(() => [
      { tx: "9", seq: 5, latest: false },
      { tx: "9", seq: "7", latest: true },
    ]);
    await expect(new PostgresChangeFeedDriver(first.database).positionAt(NOON)).resolves.toBe(
      "9:4",
    );
    expect(first.statements[0]?.sql).toBe(
      "select tx::text as tx, seq, latest from outbox.change_position_at(?::timestamptz)",
    );
    const last = databaseWith(() => [{ tx: "9", seq: "7", latest: true }]);
    await expect(new PostgresChangeFeedDriver(last.database).positionAt(NOON)).resolves.toBe("9:7");
    await expect(
      new PostgresChangeFeedDriver(databaseWith().database).positionAt(NOON),
    ).resolves.toBeUndefined();
  });

  it("claims expired default-partition rows and removes positions under the caller's row-level security", async () => {
    const { database, statements } = databaseWith((sql) =>
      sql.includes("claim_expired_changes") ? [{ tx: "3", seq: "1", tenant_id: "scp_acme" }] : [],
    );
    const feed = new PostgresChangeFeedDriver(database);
    await expect(feed.expired(NOON, 500)).resolves.toEqual([
      { position: "3:1", ownerId: "scp_acme" },
    ]);
    expect(statements[0]?.params).toEqual([NOON, 500]);
    await feed.remove(["3:1"]);
    expect(statements[1]?.sql).toContain(
      "delete from outbox.changes c using jsonb_to_recordset(?::jsonb)",
    );
    expect(statements[1]?.params).toEqual([JSON.stringify([{ tx: "3", seq: "1" }])]);
    await feed.remove([]);
    expect(statements).toHaveLength(2);
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
    expect(
      statements
        .filter((statement) => statement.sql === "select outbox.secure_change_partition(?)")
        .map((statement) => statement.params),
    ).toEqual([["changes_p20261026"], ["changes_p20261027"], ["changes_p20261028"]]);
    expect(sql.some((text) => text.includes("delete"))).toBe(false);
  });
});
