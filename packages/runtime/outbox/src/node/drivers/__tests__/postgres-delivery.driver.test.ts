/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresDeliveryDriver`: a write is one batch insert that skips a stored delivery by the
 *          unique key; `due` ranks each subscriber's live due deliveries in a window and takes every subscriber's first
 *          before any subscriber's second, with every value bound, and reads rows back into deliveries (envelope,
 *          failure, dead time); `remove`, `retry`, `deadLetter` and `pruneDead` are one bound statement each; `list`
 *          picks one of three fixed state predicates and binds the subscriber; `replay` revives only a dead delivery
 *          and says whether one changed.
 * Boundary: test only; a stand-in entity manager records each statement and answers fixed rows, so no database runs.
 *           The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decisions 12 and 13); ADR 0078 (decision 4); ADR 0160.
 */
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { DeliveryDriver } from "#contracts/index";
import type { Delivery } from "#contracts/index";
import { PostgresDeliveryDriver } from "#node/drivers/postgres-delivery.driver";

const NOON = new Date(Date.UTC(2026, 9, 25, 12));

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

const ENVELOPE = {
  id: "evt_1",
  type: "payments.payment.captured.v1",
  occurredAt: NOON.toISOString(),
  envelopeVersion: 1,
  meta: { correlationId: "call-1" },
  data: { amount: 5 },
  scope: { id: "scp_1", path: "platform.acme" },
};

/** A stored row of `outbox.deliveries`. */
const ROW = {
  id: "dlv_A",
  subscriber: "shop",
  envelope: ENVELOPE,
  attempts: 2,
  available_at: NOON,
  created_at: NOON,
  last_error: { code: "http_503", message: "consumer down" },
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
    for (const value of ["dlv_A", "evt_1", "shop", "consumer down"])
      expect(statement.sql).not.toContain(value);
  }
}

describe(PostgresDeliveryDriver, () => {
  it("is a DeliveryDriver", () => {
    expect(new PostgresDeliveryDriver({} as Database)).toBeInstanceOf(DeliveryDriver);
  });

  // @covers sta-1910:FR-003
  it("writes one batch and skips a delivery already stored under the unique key", async () => {
    const { database, statements } = databaseWith();
    const delivery: Delivery = {
      id: "dlv_A",
      subscriber: "shop",
      envelope: ENVELOPE as Delivery["envelope"],
      attempts: 0,
      availableAt: NOON,
      createdAt: NOON,
    };
    await new PostgresDeliveryDriver(database).write([delivery]);
    expect(statements).toHaveLength(1);
    expect(statements[0]?.sql).toContain('insert into "outbox"."deliveries"');
    expect(statements[0]?.sql).toContain("on conflict (event_id, subscriber, type) do nothing");
    const [json] = statements[0]?.params ?? [];
    expect(JSON.parse(String(json))).toEqual([
      {
        id: "dlv_A",
        event_id: "evt_1",
        subscriber: "shop",
        type: "payments.payment.captured.v1",
        envelope: ENVELOPE,
        attempts: 0,
        available_at: NOON.toISOString(),
        created_at: NOON.toISOString(),
        last_error: null,
        dead_at: null,
      },
    ]);
    expectBound(statements);
  });

  it("writes nothing for an empty batch", async () => {
    const { database, statements } = databaseWith();
    await new PostgresDeliveryDriver(database).write([]);
    expect(statements).toEqual([]);
  });

  // @covers sta-1910:FR-003
  // @covers sta-1910:SC-003
  it("ranks each subscriber's due deliveries and takes the first of every subscriber before the second", async () => {
    const { database, statements } = databaseWith([ROW]);
    const deliveries = await new PostgresDeliveryDriver(database).due(NOON, 100);
    const sql = statements[0]?.sql ?? "";
    expect(sql).toContain(
      "row_number() over (partition by subscriber order by created_at, id) as turn",
    );
    expect(sql).toContain("where dead_at is null and available_at <= ?");
    expect(sql).toContain(") as ranked order by turn, created_at, id limit ?");
    expect(statements[0]?.params).toEqual([NOON, 100]);
    expect(deliveries).toEqual([
      {
        id: "dlv_A",
        subscriber: "shop",
        envelope: ENVELOPE,
        attempts: 2,
        availableAt: NOON,
        createdAt: NOON,
        lastError: { code: "http_503", message: "consumer down" },
      },
    ]);
    expectBound(statements);
  });

  it("leaves out a failure the row does not hold and reads the dead time", async () => {
    const { database } = databaseWith([{ ...ROW, last_error: null, dead_at: NOON }]);
    const [delivery] = await new PostgresDeliveryDriver(database).due(NOON, 1);
    expect(delivery?.lastError).toBeUndefined();
    expect(delivery?.deadAt).toEqual(NOON);
  });

  it("refuses a row whose envelope is not a version 1 envelope", async () => {
    const { database } = databaseWith([{ ...ROW, envelope: { ...ENVELOPE, envelopeVersion: 2 } }]);
    await expect(new PostgresDeliveryDriver(database).due(NOON, 1)).rejects.toThrow();
  });

  it("removes, retries and dead-letters with one bound statement each", async () => {
    const { database, statements } = databaseWith();
    const driver = new PostgresDeliveryDriver(database);
    await driver.remove("dlv_A");
    await driver.retry("dlv_A", NOON, { code: "http_503", message: "consumer down" });
    await driver.deadLetter("dlv_A", { code: "http_503", message: "consumer down" }, NOON);
    expect(statements.map((statement) => statement.sql)).toEqual([
      'delete from "outbox"."deliveries" where id = ?',
      'update "outbox"."deliveries" set attempts = attempts + 1, available_at = ?, last_error = ?::jsonb where id = ?',
      'update "outbox"."deliveries" set attempts = attempts + 1, dead_at = ?, last_error = ?::jsonb where id = ?',
    ]);
    expect(statements[1]?.params).toEqual([
      NOON,
      JSON.stringify({ code: "http_503", message: "consumer down" }),
      "dlv_A",
    ]);
    expectBound(statements);
  });

  // @covers sta-1910:FR-014
  it("lists each state by a fixed predicate, oldest first, and binds the subscriber", async () => {
    const { database, statements } = databaseWith([ROW]);
    const driver = new PostgresDeliveryDriver(database);
    await driver.list({ state: "pending" });
    await driver.list({ state: "failing", subscriber: "shop" });
    await driver.list({ state: "dead", subscriber: "shop" });
    const [pending, failing, dead] = statements;
    expect(pending?.sql).toContain(
      "where dead_at is null and attempts = 0 order by created_at, id",
    );
    expect(pending?.params).toEqual([]);
    expect(failing?.sql).toContain(
      "where dead_at is null and attempts > 0 and subscriber = ? order by created_at, id",
    );
    expect(failing?.params).toEqual(["shop"]);
    expect(dead?.sql).toContain(
      "where dead_at is not null and subscriber = ? order by created_at, id",
    );
    expectBound(statements);
  });

  // @covers sta-1910:FR-014
  // @covers sta-1910:SC-003
  it("replays only a dead delivery and says whether one changed", async () => {
    const changed = databaseWith([{ id: "dlv_A" }]);
    expect(await new PostgresDeliveryDriver(changed.database).replay("dlv_A", NOON)).toBe(true);
    expect(changed.statements[0]?.sql).toBe(
      'update "outbox"."deliveries" set dead_at = null, attempts = 0, available_at = ?, last_error = null ' +
        "where id = ? and dead_at is not null returning id",
    );
    expect(changed.statements[0]?.params).toEqual([NOON, "dlv_A"]);
    expectBound(changed.statements);
    const unchanged = databaseWith([]);
    expect(await new PostgresDeliveryDriver(unchanged.database).replay("dlv_A", NOON)).toBe(false);
  });

  it("prunes old dead letters and counts them", async () => {
    const { database, statements } = databaseWith([{ id: "dlv_A" }, { id: "dlv_B" }]);
    expect(await new PostgresDeliveryDriver(database).pruneDead(NOON)).toBe(2);
    expect(statements[0]?.sql).toContain("where dead_at is not null and dead_at < ? returning id");
    expect(statements[0]?.params).toEqual([NOON]);
    expectBound(statements);
  });
});
