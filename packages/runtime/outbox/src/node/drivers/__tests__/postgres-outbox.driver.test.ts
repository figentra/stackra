/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresOutboxDriver`: a write goes through the batch insert on the running context's entity
 *          manager; `due` selects live due messages oldest first with every value bound and reads rows back into
 *          messages (scope, failure, dead time); `remove`, `retry`, `deadLetter` and `pruneDead` are one bound
 *          statement each.
 * Boundary: test only; a stand-in entity manager records each statement and answers fixed rows, so no database runs.
 *           The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0078 (decision 4); ADR 0160.
 */
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { MessageKind, OutboxDriver } from "#contracts/index";
import { PostgresOutboxDriver } from "#node/drivers/postgres-outbox.driver";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

/** A stored row of `outbox.messages`. */
const ROW = {
  id: "evt_A",
  kind: "change",
  type: "Product",
  data: { model: "Product", id: "prd_1", kind: "updated", fields: ["name"] },
  meta: { correlationId: "call-1" },
  occurred_at: NOON,
  scope_id: "scp_1",
  scope_path: "platform.acme",
  attempts: 2,
  available_at: NOON,
  last_error: { code: "internal", message: "index down" },
  dead_at: null,
};

/** A database whose entity manager records each statement and answers `rows`. */
function databaseWith(rows: readonly object[] = []) {
  const statements: Statement[] = [];
  const em = {
    execute: async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      return rows;
    },
  };
  return { database: { em: () => em } as unknown as Database, statements };
}

/** Asserts every statement binds its values: one placeholder per parameter, no value in the text. */
function expectBound(statements: readonly Statement[]): void {
  for (const statement of statements) {
    expect(statement.sql.split("?")).toHaveLength(statement.params.length + 1);
    for (const value of ["evt_A", "prd_1", "scp_1", "index down"])
      expect(statement.sql).not.toContain(value);
  }
}

describe(PostgresOutboxDriver, () => {
  it("is an OutboxDriver", () => {
    expect(new PostgresOutboxDriver({} as Database)).toBeInstanceOf(OutboxDriver);
  });

  it("writes through the batch insert on the running entity manager", async () => {
    const { database, statements } = databaseWith();
    await new PostgresOutboxDriver(database).write([
      {
        id: "evt_A",
        kind: MessageKind.Event,
        type: "orders.order.paid.v1",
        data: {},
        meta: {},
        occurredAt: NOON,
        attempts: 0,
        availableAt: NOON,
      },
    ]);
    expect(statements[0]?.sql).toContain('insert into "outbox"."messages"');
    expectBound(statements);
  });

  it("lists live due messages oldest first and reads them back", async () => {
    const { database, statements } = databaseWith([ROW]);
    const messages = await new PostgresOutboxDriver(database).due(NOON, 100);
    expect(statements[0]?.sql).toContain("where dead_at is null and available_at <= ?");
    expect(statements[0]?.sql).toContain("order by occurred_at, id limit ?");
    expect(statements[0]?.params).toEqual([NOON, 100]);
    expect(messages).toEqual([
      {
        id: "evt_A",
        kind: MessageKind.Change,
        type: "Product",
        data: ROW.data,
        meta: { correlationId: "call-1" },
        occurredAt: NOON,
        scope: { id: "scp_1", path: "platform.acme" },
        attempts: 2,
        availableAt: NOON,
        lastError: { code: "internal", message: "index down" },
      },
    ]);
    expectBound(statements);
  });

  it("leaves out a scope and a failure the row does not hold", async () => {
    const { database } = databaseWith([
      { ...ROW, scope_id: null, scope_path: null, last_error: null, dead_at: NOON },
    ]);
    const [message] = await new PostgresOutboxDriver(database).due(NOON, 1);
    expect(message?.scope).toBeUndefined();
    expect(message?.lastError).toBeUndefined();
    expect(message?.deadAt).toEqual(NOON);
  });

  it("removes, retries and dead-letters with one bound statement each", async () => {
    const { database, statements } = databaseWith();
    const driver = new PostgresOutboxDriver(database);
    const failure = { code: "internal", message: "index down" };
    await driver.remove("evt_A");
    await driver.retry("evt_A", NOON, failure);
    await driver.deadLetter("evt_A", failure, NOON);
    expect(statements.map((statement) => statement.params)).toEqual([
      ["evt_A"],
      [NOON, JSON.stringify(failure), "evt_A"],
      [NOON, JSON.stringify(failure), "evt_A"],
    ]);
    expect(statements[1]?.sql).toContain("attempts = attempts + 1, available_at = ?");
    expect(statements[2]?.sql).toContain("attempts = attempts + 1, dead_at = ?");
    expectBound(statements);
  });

  it("prunes old dead letters with one bound statement and counts them", async () => {
    const { database, statements } = databaseWith([{ id: "evt_A" }, { id: "evt_B" }]);
    await expect(new PostgresOutboxDriver(database).pruneDead(NOON)).resolves.toBe(2);
    expect(statements[0]?.sql).toContain("where dead_at is not null and dead_at < ? returning id");
    expect(statements[0]?.params).toEqual([NOON]);
    expectBound(statements);
  });
});
