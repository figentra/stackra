/**
 * Stackra file contract:
 * Purpose: unit tests of `PostgresScheduleDriver`: each method's statement binds every value (one placeholder per
 *          parameter, no value in the text), reads its rows through zod into the port's shapes, deletes a schedule
 *          only with its scope and with its watermark, and advances every key in one upsert (none for no key).
 * Boundary: test only; a recording entity manager stands in for the database. A Postgres integration test runs with
 *           the testing workflow.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0160; ADR 0148 (decision 5).
 */
import type { ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { Misfire, ScheduleDriver } from "#contracts/index";
import type { Schedule } from "#contracts/index";
import { PostgresScheduleDriver } from "#node/drivers/postgres-schedule.driver";

const NOON = new Date(Date.UTC(2026, 9, 24, 12));

const acme: ScopeRef = { id: "scp_acme", path: "platform.acme" };

/** One recorded statement. */
interface Statement {
  readonly sql: string;
  readonly params: readonly unknown[];
}

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

/** A schedule to store. */
const schedule: Schedule = {
  id: "sch_1",
  scope: acme,
  key: "digests.digest.send@1",
  cron: "0 8 * * mon",
  timeZone: "Asia/Dubai",
  input: { audience: "buyers" },
  misfire: Misfire.Once,
  createdAt: NOON,
};

/** Asserts every statement binds its values: one placeholder per parameter, no value in the text. */
function expectBound(statements: readonly Statement[]): void {
  for (const statement of statements) {
    expect(statement.sql.split("?")).toHaveLength(statement.params.length + 1);
    for (const value of ["sch_1", "scp_acme", "buyers", "Asia/Dubai", "digests.digest"])
      expect(statement.sql).not.toContain(value);
  }
}

describe(PostgresScheduleDriver, () => {
  it("is a ScheduleDriver", () => {
    expect(new PostgresScheduleDriver({} as Database)).toBeInstanceOf(ScheduleDriver);
  });

  it("inserts a schedule with every value bound and its input as JSON", async () => {
    const { database, statements } = databaseWith();
    await new PostgresScheduleDriver(database).add(schedule);
    const [insert] = statements;
    expect(insert?.sql).toContain('insert into "scheduler"."schedules"');
    expect(insert?.params).toEqual([
      "sch_1",
      "scp_acme",
      "platform.acme",
      "digests.digest.send@1",
      "0 8 * * mon",
      "Asia/Dubai",
      '{"audience":"buyers"}',
      "once",
      NOON,
    ]);
    expectBound(statements);
  });

  it("deletes a schedule only with its scope, and its watermark in the same statement", async () => {
    const gone = databaseWith([{ id: "sch_1" }]);
    await expect(new PostgresScheduleDriver(gone.database).remove("sch_1", acme)).resolves.toBe(
      true,
    );
    const [statement] = gone.statements;
    expect(statement?.sql).toContain("where id = ? and scope_id = ?");
    expect(statement?.sql).toContain('delete from "scheduler"."watermarks"');
    expect(statement?.params).toEqual(["sch_1", "scp_acme"]);
    expectBound(gone.statements);
    const kept = databaseWith([]);
    await expect(new PostgresScheduleDriver(kept.database).remove("sch_1", acme)).resolves.toBe(
      false,
    );
  });

  it("reads schedules through zod, of one scope or of all", async () => {
    const { database, statements } = databaseWith([
      {
        id: "sch_1",
        scope_id: "scp_acme",
        scope_path: "platform.acme",
        job_key: "digests.digest.send@1",
        cron: "0 8 * * mon",
        time_zone: "Asia/Dubai",
        input: { audience: "buyers" },
        misfire: "once",
        created_at: NOON.toISOString(),
      },
    ]);
    const driver = new PostgresScheduleDriver(database);
    await expect(driver.schedules(acme)).resolves.toEqual([schedule]);
    await driver.schedules();
    expect(statements[0]?.sql).toContain("where scope_id = ? order by id");
    expect(statements[0]?.params).toEqual(["scp_acme"]);
    expect(statements[1]?.sql).not.toContain("where");
    expectBound(statements);
  });

  it("refuses a row that is not a schedule", async () => {
    const { database } = databaseWith([{ id: "job_1" }]);
    await expect(new PostgresScheduleDriver(database).schedules()).rejects.toThrow();
  });

  it("reads every watermark by key", async () => {
    const { database } = databaseWith([
      { schedule_key: "access_log.entry.purge@1", ticked_at: NOON.toISOString() },
    ]);
    const marks = await new PostgresScheduleDriver(database).watermarks();
    expect(marks.get("access_log.entry.purge@1")).toEqual(NOON);
  });

  it("advances every key in one bound upsert, and runs nothing for no key", async () => {
    const { database, statements } = databaseWith();
    const driver = new PostgresScheduleDriver(database);
    await driver.advance(["access_log.entry.purge@1", "sch_1"], NOON);
    await driver.advance([], NOON);
    expect(statements).toHaveLength(1);
    expect(statements[0]?.sql).toContain("on conflict (schedule_key) do update");
    expect(statements[0]?.params).toEqual([NOON, '["access_log.entry.purge@1","sch_1"]']);
    expectBound(statements);
  });
});
