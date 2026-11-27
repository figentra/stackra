/**
 * Stackra file contract:
 * Purpose: proves `db:migrate` applies through the runner, returns the applied names as --json data, passes `--env` and `--cwd`,
 *          records an audit entry, and is refused when no `CommandAudit` is bound; it names its release as `stackra db
 *          migrate` does (`--release`, else `STACKRA_RELEASE`, else the commit of the checkout at `--cwd`), and with
 *          none the real `migrate` refuses a forward-only run holding a contract step, naming `--release` and
 *          `STACKRA_RELEASE` (STA-1406).
 * Boundary: test only; the `DatabaseRunner` is a fake served through the container, or the real `migrate` over an
 *           in-memory session (`openMigrationSession` mocked), so no Postgres runs; git is scripted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1731 spec FR-001 and FR-015.
 */
// @covers sta-1731:FR-001 sta-1731:FR-015
import {
  MemoryCommandAuditDriver,
  MemoryProcessRunnerDriver,
  runCommandForTest,
} from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { releaseGateSql } from "#core/functions/release-gate-sql.function";
import { DbMigrateCommand } from "#node/commands/db-migrate.command";
import { migrate } from "#node/functions/migrate.function";
import type { MigrationFile } from "#node/types/migration-file.type";
import type { MigrationSession } from "#node/types/migration-session.type";

/** The member's database for the real `migrate`: version 1 applied, a contract step pending. */
const session = vi.hoisted(() => ({
  executed: [] as string[],
  /** A compiled step file of the `orders` module. */
  file: (version: number, name: string, sql: string): MigrationFile => ({
    version,
    name,
    batch: "orders",
    transactional: true,
    timeout: undefined,
    sql,
    checksum: `sum${version}`,
    legacyChecksum: `legacy${version}`,
    inverse: undefined,
  }),
}));

vi.mock("#node/functions/open-migration-session.function", () => ({
  openMigrationSession: async <T>(_cwd: string, run: (open: MigrationSession) => Promise<T>) =>
    run({
      files: [
        session.file(1, "0001_orders_0001_create_orders", "select 1"),
        session.file(
          2,
          "0002_orders_0002_drop_note",
          `${releaseGateSql("orders.0001_create_orders", "orders.orders drop column note")};\nalter table orders.orders drop column note`,
        ),
      ],
      execute: async (sql) => {
        session.executed.push(sql);
      },
      query: async () => [],
      state: async () => ({ version: 1, dirty: false }),
      history: async () => [
        { version: 1, name: "0001_orders_0001_create_orders", checksum: "sum1" },
      ],
    }),
}));

/** The text of an error box, its frame removed and its lines joined. */
const unboxed = (text: string): string => text.replaceAll(/[│╭╮╰╯─]/g, " ").replaceAll(/\s+/g, " ");

/** The commit the member's checkout is at. */
const HEAD = "4f1c2b0e9d8a7f6e5d4c3b2a1908f7e6d5c4b3a2";

/** The git line the release chain runs. */
const REV_PARSE = "git rev-parse --verify --quiet HEAD";

beforeEach(() => {
  session.executed = [];
  vi.stubEnv("STACKRA_RELEASE", undefined);
  vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/** A container that serves `runner` as the `DatabaseRunner` and builds each command with it. */
const serving =
  (runner: object, audited = true) =>
  async () => ({
    get: <T extends object>(type: abstract new (...args: never[]) => T): T =>
      Reflect.construct(type, [runner]) as T,
    has: () => audited,
    close: async () => {},
  });

describe("DbMigrateCommand", () => {
  it("applies the pending files and audits the run", async () => {
    const runner = { migrate: vi.fn(async () => ({ applied: ["0001_orders_create"] })) };
    const audit = new MemoryCommandAuditDriver();
    const result = await runCommandForTest(
      [DbMigrateCommand],
      ["db:migrate", "--env", "staging", "--cwd", "apps/api", "--json"],
      { audit, container: serving(runner) },
    );
    expect(result.json).toEqual({ ok: true, data: { applied: ["0001_orders_create"] } });
    expect(runner.migrate).toHaveBeenCalledWith({ cwd: "apps/api", environment: "staging" });
    expect(audit.entries[0]).toMatchObject({ command: "db:migrate", outcome: "ok", exitCode: 0 });
  });

  it("hands the runner the release a run applies (STA-1406)", async () => {
    const runner = { migrate: vi.fn(async () => ({ applied: [] })) };
    const result = await runCommandForTest(
      [DbMigrateCommand],
      ["db:migrate", "--env", "production", "--cwd", "apps/api", "--release", "v1.4.0", "--json"],
      { audit: new MemoryCommandAuditDriver(), container: serving(runner) },
    );
    expect(result.exitCode).toBe(0);
    expect(runner.migrate).toHaveBeenCalledWith({
      cwd: "apps/api",
      environment: "production",
      release: "v1.4.0",
    });
  });

  it("names the commit of the checkout at --cwd when no release is named, as stackra db migrate does (STA-1406)", async () => {
    const runner = { migrate: vi.fn(async () => ({ applied: [] })) };
    const process = new MemoryProcessRunnerDriver().on(REV_PARSE, { output: `${HEAD}\n` });
    const result = await runCommandForTest(
      [DbMigrateCommand],
      ["db:migrate", "--env", "production", "--cwd", "apps/api"],
      { audit: new MemoryCommandAuditDriver(), container: serving(runner), process },
    );
    expect(result.exitCode).toBe(0);
    expect(process.calls.map((call) => [call.line, call.cwd])).toEqual([[REV_PARSE, "apps/api"]]);
    expect(runner.migrate).toHaveBeenCalledWith({
      cwd: "apps/api",
      environment: "production",
      release: HEAD,
    });
  });

  it("prefers --release, then STACKRA_RELEASE, over the checkout's commit (STA-1406)", async () => {
    const runner = { migrate: vi.fn(async () => ({ applied: [] })) };
    const process = new MemoryProcessRunnerDriver().on(REV_PARSE, { output: `${HEAD}\n` });
    const run = (...extra: string[]) =>
      runCommandForTest(
        [DbMigrateCommand],
        ["db:migrate", "--env", "production", "--cwd", "apps/api", ...extra],
        { audit: new MemoryCommandAuditDriver(), container: serving(runner), process },
      );
    vi.stubEnv("STACKRA_RELEASE", "2026.11.27-1");
    await run("--release", "v1.4.0");
    expect(runner.migrate).toHaveBeenLastCalledWith({
      cwd: "apps/api",
      environment: "production",
      release: "v1.4.0",
    });
    await run();
    expect(runner.migrate).toHaveBeenLastCalledWith({
      cwd: "apps/api",
      environment: "production",
      release: "2026.11.27-1",
    });
    expect(process.calls).toEqual([]);
  });

  it("gives the runner's refusal naming --release and STACKRA_RELEASE when no release can be named and a contract step is pending (STA-1406)", async () => {
    const outside = new MemoryProcessRunnerDriver().on(REV_PARSE, { code: 128 });
    const result = await runCommandForTest(
      [DbMigrateCommand],
      ["db:migrate", "--env", "production", "--cwd", "apps/api"],
      { audit: new MemoryCommandAuditDriver(), container: serving({ migrate }), process: outside },
    );
    expect(result.exitCode).not.toBe(0);
    const refusal = unboxed(result.stderr);
    expect(refusal).toContain("names no release");
    expect(refusal).toContain("pass --release <version or commit> to stackra db migrate");
    expect(refusal).toContain("or set STACKRA_RELEASE=<version or commit>");
    expect(session.executed).toEqual([]);
    // the same run in the member's checkout names its commit and applies the contract step
    const checkout = new MemoryProcessRunnerDriver().on(REV_PARSE, { output: `${HEAD}\n` });
    const applied = await runCommandForTest(
      [DbMigrateCommand],
      ["db:migrate", "--env", "production", "--cwd", "apps/api", "--json"],
      { audit: new MemoryCommandAuditDriver(), container: serving({ migrate }), process: checkout },
    );
    expect(applied.json).toEqual({ ok: true, data: { applied: ["0002_orders_0002_drop_note"] } });
    expect(session.executed.join("\n")).toContain(
      `set_config('stackra.migrate_release', '${HEAD}', true)`,
    );
  });

  it("is refused when no CommandAudit is bound", async () => {
    const runner = { migrate: vi.fn() };
    const result = await runCommandForTest([DbMigrateCommand], ["db:migrate"], {
      container: serving(runner, false),
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("CommandAudit");
    expect(runner.migrate).not.toHaveBeenCalled();
  });
});
