/**
 * Stackra file contract:
 * Purpose: unit tests of `migrate`: an edited applied file is refused, applied files are adopted into the history, a
 *          step timeout is set and reset, each applied file is recorded with its checksum and release, a failed
 *          concurrent index is dropped with the version put back clean, a forward-only run naming no release is
 *          refused on a database with applied files only while a pending file holds a contract step (plain additive
 *          files apply as before), the refusal naming `--release` and `STACKRA_RELEASE`, a contract step waiting for
 *          a migration the same run applies is refused before any statement, and a named run records its release as
 *          finished only when every file applied (STA-1406).
 * Boundary: test only; `openMigrationSession` is mocked by an in-memory session that records the SQL, so no Postgres
 *           runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { releaseGateSql } from "#core/functions/release-gate-sql.function";
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
        // a transactional file runs after the gate settings, so it fails when its text ends the statement
        if (fake.fail !== undefined && sql.endsWith(fake.fail)) throw new Error("boom");
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

  it("sets the release gate's starting version and release in each transactional file's own transaction in a forward-only environment (STA-1406)", async () => {
    reset([file(1, "select 1"), file(2, "select 2")], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "sum1" }];
    await migrate({ cwd: ".", environment: "production", release: "v2" }, {});
    // transaction-local, at the head of the file's own transaction: never a session-level setting (ADR 0495)
    expect(fake.executed).toContainEqual([
      "select set_config('stackra.migrate_from_version', '1', true), set_config('stackra.migrate_release', 'v2', true);\nselect 2",
      true,
    ]);
    expect(fake.executed.some(([sql]) => /set_config\([^)]*, false\)/.test(sql))).toBe(false);
  });

  it("leaves a non-transactional file as written, with no setting before it (STA-1406)", async () => {
    const index = "create index concurrently idx_orders_a on orders.orders (a)";
    reset([file(1, "select 1"), file(2, index, { transactional: false })], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "sum1" }];
    await migrate({ cwd: ".", environment: "production", release: "v2" }, {});
    expect(fake.executed).toContainEqual([index, false]);
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
    expect(sql).toContain(
      "select set_config('stackra.migrate_from_version', '1', true), set_config('stackra.migrate_release', 'v1.4.0', true);\nselect 2",
    );
    expect(sql.at(-2)).toContain(
      "insert into schema_migrations_history (version, name, checksum, release_id) values (2, '0002_orders_step', 'sum2', 'v1.4.0')",
    );
  });

  it("records a named release as finished, with the last file it holds, once every pending file applied (STA-1406)", async () => {
    reset([file(1, "select 1"), file(2, "select 2")], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "sum1" }];
    await migrate({ cwd: ".", environment: "production", release: "v2" }, {});
    expect(fake.executed.at(-1)).toEqual([
      "insert into schema_migrations_releases (release_id, through_version) values ('v2', 2) on conflict (release_id) do update set through_version = greatest(schema_migrations_releases.through_version, excluded.through_version), finished_at = now()",
      true,
    ]);
  });

  it("records no finished release when a file fails, so a release whose code never went live never counts as serving (STA-1406)", async () => {
    reset([file(1, "select 1"), file(2, "select 2"), file(3, "select 3")], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "sum1" }];
    fake.fail = "select 3";
    await expect(
      migrate({ cwd: ".", environment: "production", release: "v2" }, {}),
    ).rejects.toThrow("0003_orders_step failed");
    expect(fake.executed.some(([sql]) => sql.includes("schema_migrations_releases"))).toBe(false);
  });

  it("records no finished release in a rollback environment, where no gate reads it (STA-1406)", async () => {
    reset([file(1, "select 1")]);
    await migrate({ cwd: ".", environment: "dev", release: "v1" }, {});
    expect(fake.executed.some(([sql]) => sql.includes("schema_migrations_releases"))).toBe(false);
  });

  it("refuses, before any statement, a contract step waiting for a migration the same run applies (STA-1406)", async () => {
    const stopReading = file(2, "alter table orders.orders add column memo text", {
      name: "0002_orders_0002_stop_reading_note",
    });
    const drop = file(
      3,
      `${releaseGateSql("orders.0002_stop_reading_note", "orders.orders drop column note")};\nalter table orders.orders drop column note`,
      { name: "0003_orders_0003_drop_note" },
    );
    reset([file(1, "select 1"), stopReading, drop], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "sum1" }];
    await expect(
      migrate({ cwd: ".", environment: "production", release: "v2" }, {}),
    ).rejects.toThrow(
      "refused before any change: 0003_orders_0003_drop_note holds a contract step after orders.0002_stop_reading_note, which this same run applies (0002_orders_0002_stop_reading_note); the release before this one still reads what the step removes, so move the contract step to a later release",
    );
    expect(fake.executed).toEqual([]);
    // shipped in the next release, once the migration it waits for is applied, the runner leaves it to the gate
    reset([file(1, "select 1"), stopReading, drop], 2);
    fake.history = [
      { version: 1, name: "0001_orders_step", checksum: "sum1" },
      { version: 2, name: stopReading.name, checksum: "sum2" },
    ];
    expect(await migrate({ cwd: ".", environment: "production", release: "v3" }, {})).toEqual({
      applied: ["0003_orders_0003_drop_note"],
    });
  });

  it("applies a contract step with the migration it waits for on a fresh database or in a rollback environment (STA-1406)", async () => {
    const files = [
      file(1, "select 1", { name: "0001_orders_0001_create_orders" }),
      file(2, `${releaseGateSql("orders.0001_create_orders", "orders.orders drop column note")}`, {
        name: "0002_orders_0002_drop_note",
      }),
    ];
    reset(files);
    expect(
      (await migrate({ cwd: ".", environment: "production", release: "v1" }, {})).applied,
    ).toHaveLength(2);
    // a dev database past its first files: the release gate does not hold in a rollback environment
    files.push(
      file(3, "select 3", { name: "0003_orders_0003_add_memo" }),
      file(4, releaseGateSql("orders.0003_add_memo", "orders.orders drop column memo"), {
        name: "0004_orders_0004_drop_memo",
      }),
    );
    reset(files, 2);
    expect((await migrate({ cwd: ".", environment: "dev" }, {})).applied).toHaveLength(2);
  });

  it("refuses a forward-only run that names no release while a pending file holds a contract step, before any statement, naming --release and STACKRA_RELEASE (STA-1406)", async () => {
    // the contract step's gate compares the release this run applies, so a run naming none cannot pass it
    const drop = file(
      3,
      `${releaseGateSql("orders.0001_create_orders", "orders.orders drop column note")};\nalter table orders.orders drop column note`,
      { name: "0003_orders_0003_drop_note" },
    );
    reset(
      [file(1, "select 1", { name: "0001_orders_0001_create_orders" }), file(2, "select 2"), drop],
      1,
    );
    fake.history = [{ version: 1, name: "0001_orders_0001_create_orders", checksum: "sum1" }];
    const refusal = migrate({ cwd: ".", environment: "staging" }, {});
    await expect(refusal).rejects.toThrow(
      /refused before any change: this staging run names no release, and the database already has applied migrations \(version 1\) while 0003_orders_0003_drop_note holds a contract step/,
    );
    await expect(refusal).rejects.toThrow(
      /pass --release <version or commit> to stackra db migrate, or set STACKRA_RELEASE=<version or commit> in the release step's environment/,
    );
    expect(fake.executed).toEqual([]);
  });

  it("applies plain additive files on a database with applied files when the run names no release, as before (STA-1406)", async () => {
    // no contract step is pending, so no gate reads the release: the files apply and record none
    reset([file(1, "select 1"), file(2, "select 2"), file(3, "select 3")], 1);
    fake.history = [{ version: 1, name: "0001_orders_step", checksum: "sum1" }];
    expect(await migrate({ cwd: ".", environment: "production" }, {})).toEqual({
      applied: ["0002_orders_step", "0003_orders_step"],
    });
    const sql = fake.executed.map(([statement]) => statement);
    expect(sql).toContain(
      "select set_config('stackra.migrate_from_version', '1', true);\nselect 2",
    );
    expect(sql.some((statement) => statement.includes("schema_migrations_releases"))).toBe(false);
    expect(sql.at(-1)).toContain("values (3, '0003_orders_step', 'sum3', null)");
  });

  it("applies a pending contract step once the default deploy path names its release (STA-1406)", async () => {
    const drop = file(
      2,
      `${releaseGateSql("orders.0001_create_orders", "orders.orders drop column note")};\nalter table orders.orders drop column note`,
      { name: "0002_orders_0002_drop_note" },
    );
    reset([file(1, "select 1", { name: "0001_orders_0001_create_orders" }), drop], 1);
    fake.history = [{ version: 1, name: "0001_orders_0001_create_orders", checksum: "sum1" }];
    const commit = "4f1c2b0e9d8a7f6e5d4c3b2a1908f7e6d5c4b3a2";
    expect(await migrate({ cwd: ".", environment: "production", release: commit }, {})).toEqual({
      applied: ["0002_orders_0002_drop_note"],
    });
    expect(fake.executed.map(([sql]) => sql).join("\n")).toContain(
      `set_config('stackra.migrate_release', '${commit}', true)`,
    );
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
      "select set_config('stackra.migrate_from_version', '0', true), set_config('stackra.migrate_release', '2026.11.26-3', true);\nselect 1",
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
