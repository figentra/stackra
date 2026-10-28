/**
 * Stackra file contract:
 * Purpose: unit tests of `migrate`: an edited applied file is refused, applied files are adopted into the history, a
 *          step timeout is set and reset, each applied file is recorded with its checksum, and a failed concurrent
 *          index is dropped with the version put back clean.
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

  it("adopts applied files the history lacks, then applies and records the pending ones", async () => {
    reset([file(1, "select 1"), file(2, "select 2", { timeout: "30min" })], 1);
    expect(await run()).toEqual({ applied: ["0002_orders_step"] });
    const sql = fake.executed.map(([text]) => text);
    expect(sql[0]).toContain("values (1, '0001_orders_step', 'sum1')");
    expect(sql).toContain("set statement_timeout = '30min'");
    expect(sql).toContain("set statement_timeout = '5min'");
    expect(sql.at(-1)).toContain("values (2, '0002_orders_step', 'sum2')");
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
});
