/**
 * Stackra file contract:
 * Purpose: unit tests of `migrate`: an edited applied file is refused, applied files are adopted into the history, a
 *          step timeout is set and reset, each applied file is recorded with its checksum and release, a failed
 *          concurrent index is dropped with the version put back clean, and a forward-only run naming no release is
 *          refused on a database with applied files (STA-1406).
 * Boundary: test only; `openMigrationSession` is mocked by an in-memory session that records the SQL, so no Postgres
 *           runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { migrate } from "#node/functions/migrate.function";
import type { MigrationFile } from "#node/types/migration-file.type";
import type { MigrationSession } from "#node/types/migration-session.type";

const fake = vi.hoisted(() => ({
  files: [] as MigrationFile[],
  version: 0,
  history: [] as { version: number; name: string; checksum: string }[],
  invalid: [] as { schema: string; name: string }[],
  fail: undefined as string | undefined,
  executed: [] as [string, boolean][],
}));

vi.mock("#node/functions/open-migration-session.function", () => ({
  openMigrationSession: <T>(_cwd: string, run: (session: MigrationSession) => Promise<T>) =>
    run({
      files: fake.files,
      execute: async (sql, wrap) => {
        fake.executed.push([sql, wrap]);
        if (sql === fake.fail) throw new Error("boom");
      },
      query: async () => fake.invalid,
      state: async () => ({ version: fake.version, dirty: false }),
      history: async () => fake.history,
    }),
}));

/** A step file with its defaults. */
function file(version: number, sql: string, extra: Partial<MigrationFile> = {}): MigrationFile {
  return {
    version,
    name: `000${version}_orders_step`,
    batch: "orders_step",
    transactional: true,
    timeout: undefined,
    sql,
    checksum: `sum${version}`,
    legacyChecksum: `legacy${version}`,
    inverse: undefined,
    ...extra,
  };
}

/** Resets the fake to `files` at `version`. */
function reset(files: MigrationFile[], version = 0): void {
  Object.assign(fake, { files, version, history: [], invalid: [], fail: undefined, executed: [] });
}

const run = (): Promise<{ readonly applied: readonly string[] }> =>
  migrate({ cwd: ".", environment: "dev" });

describe("migrate", () => {
  it("refuses an applied file whose checksum changed", async () => {
    reset([file(1, "select 1")], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "other" }];
    await expect(run()).rejects.toThrow("was edited after it was applied");
  });

  it("still verifies a file applied under its whole-file checksum, recorded before lint lines were left out", async () => {
    // an already-applied migration that carries a squawk ignore line: its row holds the old whole-file digest
    reset(
      [
        file(
          1,
          "-- squawk-ignore adding-field-with-default\nalter table t add column x int default 1",
        ),
      ],
      1,
    );
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "legacy1" }];
    expect(await run()).toEqual({ applied: [] });
  });

  it("adopts applied files the history lacks, then applies and records the pending ones", async () => {
    reset([file(1, "select 1"), file(2, "select 2", { timeout: "30min" })], 1);
    expect(await run()).toEqual({ applied: ["0002_orders_step"] });
    const sql = fake.executed.map(([text]) => text);
    expect(sql[0]).toContain("values (1, '0001_orders_step', 'sum1', null)");
    expect(sql).toContain("set statement_timeout = '30min'");
    expect(sql).toContain("set statement_timeout = '5min'");
    expect(sql.at(-1)).toContain("values (2, '0002_orders_step', 'sum2', null)");
  });

  it("drops the invalid index a failed concurrent build left and puts the version back clean", async () => {
    const step = file(2, "create index concurrently idx_orders_a on orders.orders (a)", {
      transactional: false,
    });
    reset([file(1, "select 1"), step], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "sum1" }];
    fake.invalid = [
      { schema: "orders", name: "idx_orders_a" },
      { schema: "other", name: "idx_unrelated" },
    ];
    fake.fail = step.sql;
    await expect(run()).rejects.toThrow("dropped invalid idx_orders_a");
    const sql = fake.executed.map(([text]) => text);
    expect(sql).toContain('drop index concurrently if exists "orders"."idx_orders_a"');
    expect(sql.some((text) => text.includes("idx_unrelated"))).toBe(false);
    expect(sql).toContain("update schema_migrations set version = 1, dirty = false");
  });

  it("sets the release gate's starting version in a forward-only environment, before any file (STA-1406)", async () => {
    reset([file(1, "select 1"), file(2, "select 2")], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "sum1" }];
    await migrate({ cwd: ".", environment: "production", release: "v2" }, {});
    const sql = fake.executed.map(([statement]) => statement);
    const gate = sql.indexOf("select set_config('stackra.migrate_from_version', '1', false)");
    expect(gate).toBeGreaterThanOrEqual(0);
    expect(gate).toBeLessThan(sql.indexOf("select 2"));
  });

  it("leaves the release gate unset in a rollback environment (STA-1406)", async () => {
    reset([file(1, "select 1")]);
    await run();
    expect(fake.executed.some(([sql]) => sql.includes("stackra.migrate_from_version"))).toBe(false);
    expect(fake.executed.some(([sql]) => sql.includes("stackra.migrate_release"))).toBe(false);
  });

  it("sets the release a run applies before any file and records it on each applied file (STA-1406)", async () => {
    reset([file(1, "select 1"), file(2, "select 2")], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "sum1" }];
    await migrate({ cwd: ".", environment: "production", release: "v1.4.0" });
    const sql = fake.executed.map(([statement]) => statement);
    const gate = sql.indexOf("select set_config('stackra.migrate_release', 'v1.4.0', false)");
    expect(gate).toBeGreaterThanOrEqual(0);
    expect(gate).toBeLessThan(sql.indexOf("select 2"));
    expect(sql.at(-1)).toContain(
      "insert into schema_migrations_history (version, name, checksum, release_id) values (2, '0002_orders_step', 'sum2', 'v1.4.0')",
    );
  });

  it("refuses a forward-only run that names no release on a database with applied files, before any statement (STA-1406)", async () => {
    // recorded with no release, the next file could not be told from the release a retry names, so a contract step
    // waiting for it would pass its gate while this release still serves
    reset([file(1, "select 1"), file(2, "select 2")], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "sum1" }];
    await expect(migrate({ cwd: ".", environment: "staging" }, {})).rejects.toThrow(
      /refused before any change: this staging run names no release, and the database already has applied migrations \(version 1\)/,
    );
    expect(fake.executed).toEqual([]);
  });

  it("applies a forward-only run that names no release on a fresh database, recording no release (STA-1406)", async () => {
    reset([file(1, "select 1")]);
    expect(await migrate({ cwd: ".", environment: "production" }, {})).toEqual({
      applied: ["0001_orders_step"],
    });
    const sql = fake.executed.map(([statement]) => statement);
    expect(sql.some((statement) => statement.includes("stackra.migrate_release"))).toBe(false);
    expect(sql.at(-1)).toContain("values (1, '0001_orders_step', 'sum1', null)");
  });

  it("lets a forward-only run that names no release through when nothing is pending (STA-1406)", async () => {
    reset([file(1, "select 1")], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "sum1" }];
    expect(await migrate({ cwd: ".", environment: "production" }, {})).toEqual({ applied: [] });
  });

  it("reads the release from STACKRA_RELEASE when none is passed (STA-1406)", async () => {
    reset([file(1, "select 1")]);
    await migrate({ cwd: ".", environment: "production" }, { STACKRA_RELEASE: "2026.11.26-3" });
    expect(fake.executed.map(([sql]) => sql)).toContain(
      "select set_config('stackra.migrate_release', '2026.11.26-3', false)",
    );
  });

  it("refuses a release that is not a version, tag or commit, before connecting (STA-1406)", async () => {
    reset([file(1, "select 1")]);
    await expect(
      migrate({ cwd: ".", environment: "production", release: "v1'; drop table x" }),
    ).rejects.toThrow(/is not a version, tag or commit/);
    expect(fake.executed).toEqual([]);
  });
});
