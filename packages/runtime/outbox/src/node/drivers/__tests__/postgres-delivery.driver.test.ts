/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresDeliveryDriver`: a write is one insert-or-ignore on (event id, subscriber, type) of a
 *          bound JSON array, and none for an empty batch; `lease` and `list` call their system functions with every
 *          value bound and read back claims (id, owner, subscriber, state; a NULL tenant is a platform claim) in the
 *          relay's order; `load` reads one row back into a delivery or undefined; `remove`, `retry`, `deadLetter` and
 *          `replay` are one bound statement each, `replay` touching dead rows only.
 * Boundary: test only; a stand-in entity manager records each statement and answers fixed rows, so no database runs.
 *           The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0511 (decisions 12 and 13); ADR 0160.
 */
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { DeliveryDriver, DeliveryState } from "#contracts/index";
import { deliveryOf } from "#core/__tests__/fixtures/delivery.fixture";
import { PostgresDeliveryDriver } from "#node/drivers/postgres-delivery.driver";

const NOON = new Date(Date.UTC(2026, 10, 6, 12));

const LATER = new Date(NOON.getTime() + 110_000);

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

/** A stored row of `outbox.deliveries`. */
const ROW = {
  id: "dlv_1",
  event_id: "evt_1",
  subscriber: "billing",
  type: "payments.payment.captured.v1",
  envelope: { id: "evt_1", type: "payments.payment.captured.v1", envelopeVersion: 1 },
  attempts: 2,
  available_at: NOON,
  last_error: { code: "http_status", status: 503 },
  dead_at: null,
  created_at: NOON,
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
    for (const value of ["dlv_1", "evt_1", "billing", "http_status"])
      expect(statement.sql).not.toContain(value);
  }
}

describe(PostgresDeliveryDriver, () => {
  it("is a DeliveryDriver", () => {
    expect(new PostgresDeliveryDriver({} as Database)).toBeInstanceOf(DeliveryDriver);
  });

  it("writes a batch as one insert-or-ignore, and nothing for none", async () => {
    const { database, statements } = databaseWith();
    const driver = new PostgresDeliveryDriver(database);
    await driver.write([]);
    expect(statements).toEqual([]);
    await driver.write([deliveryOf()]);
    expect(statements[0]?.sql).toContain('insert into "outbox"."deliveries"');
    expect(statements[0]?.sql).toContain("on conflict (event_id, subscriber, type) do nothing");
    expect(JSON.parse(String(statements[0]?.params[0]))).toEqual([
      expect.objectContaining({ id: "dlv_1", event_id: "evt_1", subscriber: "billing" }),
    ]);
    expectBound(statements);
  });

  it("leases each subscriber's due rows of every owner through the system function, in the relay's order", async () => {
    const { database, statements } = databaseWith([
      { id: "dlv_1", tenant_id: "scp_acme", subscriber: "billing", attempts: 2, dead_at: null },
      { id: "dlv_2", tenant_id: null, subscriber: "os", attempts: 0, dead_at: null },
    ]);
    const due = await new PostgresDeliveryDriver(database).lease(NOON, 10, LATER);
    const [statement] = statements;
    expect(statement?.sql).toContain(
      "from outbox.lease_due_deliveries(?::timestamptz, ?::integer, ?::timestamptz) as l",
    );
    expect(statement?.sql).toContain("order by l.subscriber, l.created_at, l.id");
    expect(statement?.params).toEqual([NOON, 10, LATER]);
    expect(due).toEqual([
      { id: "dlv_1", ownerId: "scp_acme", subscriber: "billing", state: DeliveryState.Failing },
      { id: "dlv_2", subscriber: "os", state: DeliveryState.Pending },
    ]);
    expectBound(statements);
  });

  it("loads one delivery under the caller's row-level security and reads it back", async () => {
    const { database, statements } = databaseWith([ROW]);
    const delivery = await new PostgresDeliveryDriver(database).load("dlv_1");
    expect(statements[0]?.sql).toContain('from "outbox"."deliveries" where id = ?');
    expect(delivery).toEqual({
      id: "dlv_1",
      eventId: "evt_1",
      subscriber: "billing",
      type: "payments.payment.captured.v1",
      envelope: ROW.envelope,
      attempts: 2,
      availableAt: NOON,
      lastError: { code: "http_status", status: 503 },
      createdAt: NOON,
    });
    await expect(
      new PostgresDeliveryDriver(databaseWith().database).load("dlv_1"),
    ).resolves.toBeUndefined();
    expectBound(statements);
  });

  it("removes, retries, dead-letters and replays with one bound statement each", async () => {
    const { database, statements } = databaseWith([{ id: "dlv_1" }]);
    const driver = new PostgresDeliveryDriver(database);
    const failure = { code: "http_status", status: 503 };
    await driver.remove("dlv_1");
    await driver.retry("dlv_1", NOON, failure);
    await driver.deadLetter("dlv_1", failure, NOON);
    await expect(driver.replay("dlv_1", NOON)).resolves.toBe(true);
    expect(statements.map((statement) => statement.params)).toEqual([
      ["dlv_1"],
      [NOON, JSON.stringify(failure), "dlv_1"],
      [NOON, JSON.stringify(failure), "dlv_1"],
      [NOON, "dlv_1"],
    ]);
    expect(statements[1]?.sql).toContain("attempts = attempts + 1, available_at = ?");
    expect(statements[2]?.sql).toContain("attempts = attempts + 1, dead_at = ?");
    expect(statements[3]?.sql).toContain("where id = ? and dead_at is not null returning id");
    expectBound(statements);
  });

  it("answers false when a replay touched no dead row", async () => {
    const { database } = databaseWith([]);
    await expect(new PostgresDeliveryDriver(database).replay("dlv_1", NOON)).resolves.toBe(false);
  });

  it("lists every owner's deliveries through the system function, every filter bound", async () => {
    const { database, statements } = databaseWith([
      { id: "dlv_1", tenant_id: "scp_acme", subscriber: "billing", attempts: 3, dead_at: NOON },
    ]);
    const driver = new PostgresDeliveryDriver(database);
    await expect(
      driver.list({ subscriber: "billing", state: DeliveryState.Dead, limit: 20 }),
    ).resolves.toEqual([
      { id: "dlv_1", ownerId: "scp_acme", subscriber: "billing", state: DeliveryState.Dead },
    ]);
    await driver.list({ id: "dlv_1", limit: 1 });
    expect(statements[0]?.sql).toContain(
      "from outbox.list_deliveries(?::varchar, ?::varchar, ?::text, ?::integer)",
    );
    expect(statements[0]?.params).toEqual([null, "billing", "dead", 20]);
    expect(statements[1]?.params).toEqual(["dlv_1", null, null, 1]);
    expectBound(statements);
  });
});
