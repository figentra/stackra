/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresQueueDriver`: one statement per method on the running context's entity manager,
 *          every value a bound parameter (input, origin and failure as JSON), a reservation through `FOR UPDATE SKIP
 *          LOCKED` filtered by queue only when one is named, a unique conflict read as `false`, rows read back into
 *          jobs (scope, origin, keys and failure), and redrive guarded by the unique key.
 * Boundary: test only; a stand-in entity manager records each statement and answers fixed rows, so no database runs.
 *           The SQL itself runs in the integration tier.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decisions 1 and 3); ADR 0160.
 */
import { Duration } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { JobStatus, QueueDriver } from "#contracts/index";
import type { QueuedJob } from "#contracts/index";
import { PostgresQueueDriver } from "#node/drivers/postgres-queue.driver";

const NOON = new Date(Date.UTC(2026, 9, 24, 12));

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

/** A stored row of `queue.jobs`. */
const ROW = {
  id: "job_a",
  queue: "delivery",
  job_key: "messages.message.deliver@1",
  input: { messageId: "msg_1" },
  origin: { kind: "service", id: "svc_commerce" },
  scope_id: "scp_1",
  scope_path: "platform.acme",
  idempotency_key: "k1",
  unique_key: null,
  caused_by: "call-1",
  status: "running",
  attempts: 1,
  run_at: NOON,
  lease: "PT6M",
  last_error: null,
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

/** A job to push. */
const job: QueuedJob = {
  id: "job_a",
  queue: "delivery",
  key: "messages.message.deliver@1",
  input: { messageId: "msg_1" },
  origin: { kind: "service", id: "svc_commerce" },
  scope: { id: "scp_1", path: "platform.acme" },
  uniqueKey: "messages.message.deliver@1:scp_1",
  status: JobStatus.Waiting,
  attempts: 0,
  runAt: NOON,
  lease: Duration.minutes(6),
};

/** Asserts every statement binds its values: one placeholder per parameter, no value in the text. */
function expectBound(statements: readonly Statement[]): void {
  for (const statement of statements) {
    expect(statement.sql.split("?")).toHaveLength(statement.params.length + 1);
    for (const value of ["job_a", "msg_1", "delivery", "scp_1", "svc_commerce"])
      expect(statement.sql).not.toContain(value);
  }
}

describe(PostgresQueueDriver, () => {
  it("is a QueueDriver", () => {
    expect(new PostgresQueueDriver({} as Database)).toBeInstanceOf(QueueDriver);
  });

  it("inserts a job with every value bound, input and origin as JSON", async () => {
    const { database, statements } = databaseWith([{ id: "job_a" }]);
    await expect(new PostgresQueueDriver(database).push(job)).resolves.toBe(true);
    const [insert] = statements;
    expect(insert?.sql).toContain('insert into "queue"."jobs"');
    expect(insert?.sql).toContain(
      "on conflict (unique_key) where status in ('waiting', 'running')",
    );
    expect(insert?.params).toEqual([
      "job_a",
      "delivery",
      "messages.message.deliver@1",
      '{"messageId":"msg_1"}',
      '{"kind":"service","id":"svc_commerce"}',
      "scp_1",
      "platform.acme",
      null,
      "messages.message.deliver@1:scp_1",
      null,
      "waiting",
      0,
      NOON,
      "PT6M",
    ]);
    expectBound(statements);
  });

  it("reads a unique conflict as false", async () => {
    const { database } = databaseWith([]);
    await expect(new PostgresQueueDriver(database).push(job)).resolves.toBe(false);
  });

  it("reserves with SKIP LOCKED, filtered by queue only when one is named, and reads the row back", async () => {
    const { database, statements } = databaseWith([ROW]);
    const driver = new PostgresQueueDriver(database);
    expect(await driver.reserve("delivery", NOON)).toEqual({
      id: "job_a",
      queue: "delivery",
      key: "messages.message.deliver@1",
      input: { messageId: "msg_1" },
      origin: { kind: "service", id: "svc_commerce" },
      scope: { id: "scp_1", path: "platform.acme" },
      idempotencyKey: "k1",
      causedBy: "call-1",
      status: JobStatus.Running,
      attempts: 1,
      runAt: NOON,
      lease: "PT6M",
    });
    await driver.reserve(undefined, NOON);
    const [named, any] = statements;
    expect(named?.sql).toContain("for update skip locked");
    expect(named?.sql).toContain("queue = ?");
    expect(named?.params).toEqual([NOON, "delivery", NOON, NOON]);
    expect(any?.sql).not.toContain("queue = ?");
    expect(any?.params).toEqual([NOON, NOON, NOON]);
    expectBound(statements);
  });

  it("finds nothing due as undefined", async () => {
    const { database } = databaseWith([]);
    await expect(
      new PostgresQueueDriver(database).reserve(undefined, NOON),
    ).resolves.toBeUndefined();
  });

  it("records a retry, a dead letter and a removal with bound values", async () => {
    const { database, statements } = databaseWith([]);
    const driver = new PostgresQueueDriver(database);
    const failure = { code: "provider_unavailable", message: "provider_unavailable" };
    await driver.retry("job_a", NOON, failure);
    await driver.deadLetter("job_a", failure);
    await driver.remove("job_a");
    expect(statements.map((statement) => statement.params)).toEqual([
      [NOON, JSON.stringify(failure), "job_a"],
      [JSON.stringify(failure), "job_a"],
      ["job_a"],
    ]);
    expect(statements[1]?.sql).toContain("status = 'dead'");
    expect(statements[2]?.sql).toContain('delete from "queue"."jobs"');
    expectBound(statements);
  });

  it("lists dead letters by queue in queue order, up to the limit", async () => {
    const { database, statements } = databaseWith([
      { ...ROW, status: "dead", last_error: { code: "internal", message: "boom" } },
    ]);
    const driver = new PostgresQueueDriver(database);
    const [dead] = await driver.deadLetters("delivery", 10);
    expect(dead).toMatchObject({ status: JobStatus.Dead, lastError: { code: "internal" } });
    await driver.deadLetters(undefined, 5);
    expect(statements.map((statement) => statement.params)).toEqual([["delivery", 10], [5]]);
    expect(statements[0]?.sql).toContain("order by id limit ?");
    expectBound(statements);
  });

  it("redrives a dead job only when no live job holds its unique key", async () => {
    const redriven = databaseWith([{ id: "job_a" }]);
    await expect(new PostgresQueueDriver(redriven.database).redrive("job_a", NOON)).resolves.toBe(
      true,
    );
    expect(redriven.statements[0]?.sql).toContain("not exists");
    expect(redriven.statements[0]?.params).toEqual([NOON, "job_a"]);
    expectBound(redriven.statements);
    const refused = databaseWith([]);
    await expect(new PostgresQueueDriver(refused.database).redrive("job_a", NOON)).resolves.toBe(
      false,
    );
  });
});
