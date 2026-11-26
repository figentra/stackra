/**
 * Stackra file contract:
 * Purpose: unit tests of `MigrationsCheckService`: up on one clean ledger version with every model table
 *          present; down on a missing, empty, multi-row or dirty ledger, on a missing model table and on a database
 *          error; its report names an error's class, never its message.
 * Boundary: test only; a stand-in `Database` answers the ledger and catalogue queries from a script. The real ledger
 *           and tables are the integration test's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (`schema_migrations`); ADR 0190 (health).
 */
import { HealthStatus } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { MigrationsCheckService } from "#modules/health/services/migrations-check.service";

/** What the stand-in database holds. */
interface Script {
  readonly ledger?: readonly { version: number | string; dirty: boolean }[];
  readonly tables?: readonly { schema?: string; tableName?: string }[];
  readonly missing?: readonly string[];
  readonly failure?: Error;
}

/** A `Database` whose `em()` answers from `script`; `lookups` records the catalogue names asked about. */
function databaseOf(script: Script): { database: Database; lookups: string[] } {
  const lookups: string[] = [];
  const em = {
    execute: async (sql: string, params?: unknown[]) => {
      if (script.failure !== undefined) throw script.failure;
      if (sql.includes("schema_migrations")) return script.ledger ?? [];
      const name = String(params?.[0]);
      lookups.push(name);
      return [{ present: !(script.missing ?? []).includes(name) }];
    },
    getMetadata: () => ({
      getAll: () => new Map((script.tables ?? []).map((meta, index) => [`E${index}`, meta])),
    }),
  };
  return { database: { em: () => em } as unknown as Database, lookups };
}

const clean = [{ version: 18, dirty: false }];
const notes = [{ schema: "notes", tableName: "notes" }, { tableName: "plain" }];

/** The migrations check. */
describe(MigrationsCheckService, () => {
  /** The port it serves names it in the probe's answer. */
  it("is the `migrations` check", () => {
    const { database } = databaseOf({});
    expect(new MigrationsCheckService(database).name).toBe("migrations");
  });

  /** One clean version and every table: up, with the latency. */
  it("is up on one clean ledger version and every model table", async () => {
    const { database, lookups } = databaseOf({ ledger: clean, tables: notes });
    const report = await new MigrationsCheckService(database).check();
    expect(report.status).toBe(HealthStatus.Up);
    expect(report.latency).toBeDefined();
    expect(lookups).toEqual(['"notes"."notes"', '"public"."plain"']);
  });

  /** A model with no table (an abstract or embedded one) is not looked up. */
  it("skips a model without a table", async () => {
    const { database, lookups } = databaseOf({ ledger: clean, tables: [{ schema: "x" }] });
    expect((await new MigrationsCheckService(database).check()).status).toBe(HealthStatus.Up);
    expect(lookups).toEqual([]);
  });

  /** No version row: nothing was applied. */
  it("is down on an empty ledger", async () => {
    const { database } = databaseOf({ ledger: [], tables: notes });
    const report = await new MigrationsCheckService(database).check();
    expect(report).toEqual({
      status: HealthStatus.Down,
      detail: "the migration ledger holds no single version",
    });
  });

  /** golang-migrate keeps one row; two means something wrote beside it. */
  it("is down on a ledger with more than one row", async () => {
    const { database } = databaseOf({
      ledger: [
        { version: 17, dirty: false },
        { version: 18, dirty: false },
      ],
    });
    expect((await new MigrationsCheckService(database).check()).status).toBe(HealthStatus.Down);
  });

  /** A crashed migration leaves the version dirty. */
  it("is down on a dirty version and names it", async () => {
    const { database } = databaseOf({ ledger: [{ version: "18", dirty: true }] });
    const report = await new MigrationsCheckService(database).check();
    expect(report).toEqual({ status: HealthStatus.Down, detail: "version 18 is dirty" });
  });

  /** The build is newer than the database. */
  it("is down, naming the tables, when a model's table is missing", async () => {
    const { database } = databaseOf({
      ledger: clean,
      tables: notes,
      missing: ['"notes"."notes"'],
    });
    const report = await new MigrationsCheckService(database).check();
    expect(report).toEqual({
      status: HealthStatus.Down,
      detail: '1 tables are not migrated: "notes"."notes"',
    });
  });

  /** An unreadable ledger (no table, no connection) is down, and only the error's class leaves. */
  it("is down when the ledger cannot be read, reporting the error's class only", async () => {
    const failure = Object.assign(new Error('relation "schema_migrations" does not exist'), {
      name: "TableNotFoundException",
    });
    const { database } = databaseOf({ failure });
    const report = await new MigrationsCheckService(database).check();
    expect(report.status).toBe(HealthStatus.Down);
    expect(report.detail).toBe("the migration state could not be read (TableNotFoundException)");
    expect(JSON.stringify(report)).not.toContain("does not exist");
  });
});
