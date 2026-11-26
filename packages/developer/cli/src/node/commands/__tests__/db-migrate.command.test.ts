/**
 * Stackra file contract:
 * Purpose: unit tests of `DbMigrateCommand` on the console: it runs the member's runner with the environment, lists
 *          what it applied (the `--json` data), says so when nothing is pending, targets dev by default and refuses an
 *          unknown environment with exit 2 before the runner loads. On preview, staging and production a stream that
 *          differs from the commit is refused with exit 1, naming the files, before the runner loads; dev and test never
 *          check it, and a clean stream or no checkout migrates (STA-2788).
 * Boundary: test only; the runner and the drift check are fakes, so no database or git is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 2 as amended); ADR 0506; STA-1966; STA-2788.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DbMigrateCommand } from "#node/commands/db-migrate.command";
import { committedMigrationDrift } from "#node/functions/committed-migration-drift.function";
import { loadDatabaseRunner } from "#node/functions/load-database-runner.function";

vi.mock("#node/functions/load-database-runner.function", () => ({ loadDatabaseRunner: vi.fn() }));
vi.mock("#node/functions/committed-migration-drift.function", () => ({
  committedMigrationDrift: vi.fn(),
}));

const migrate = vi.fn();

beforeEach(() => {
  migrate.mockReset();
  vi.mocked(loadDatabaseRunner).mockReset();
  vi.mocked(loadDatabaseRunner).mockResolvedValue({ migrate, rollback: vi.fn() });
  vi.mocked(committedMigrationDrift).mockReset();
  vi.mocked(committedMigrationDrift).mockReturnValue([]);
  vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DbMigrateCommand", () => {
  it("applies the pending migrations in the member's folder and lists them", async () => {
    migrate.mockResolvedValue({ applied: ["0001_create_orders", "0002_add_status"] });
    const result = await runCommandForTest([DbMigrateCommand], ["db:migrate", "--env", "staging"]);
    expect(result.exitCode).toBe(0);
    expect(loadDatabaseRunner).toHaveBeenCalledWith("/work");
    expect(migrate).toHaveBeenCalledWith({ cwd: "/work", environment: "staging" });
    expect(result.stdout).toContain("applied 2");
    expect(result.stdout).toContain("0002_add_status");
  });

  it("returns the environment and the applied names under --json", async () => {
    migrate.mockResolvedValue({ applied: ["0001_create_orders"] });
    const result = await runCommandForTest([DbMigrateCommand], ["db", "migrate", "--json"]);
    expect(result.json).toEqual({
      ok: true,
      data: { environment: "dev", applied: ["0001_create_orders"] },
    });
  });

  it("says so when nothing is pending", async () => {
    migrate.mockResolvedValue({ applied: [] });
    const result = await runCommandForTest(
      [DbMigrateCommand],
      ["db:migrate", "--env", "production"],
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("no pending migrations");
  });

  it("refuses an unknown environment with exit 2 and loads no runner", async () => {
    const result = await runCommandForTest([DbMigrateCommand], ["db:migrate", "--env", "qa"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("unknown environment: qa");
    expect(loadDatabaseRunner).not.toHaveBeenCalled();
  });

  /** A release applies only the committed SQL: a stream gen rewrote, or a dirty checkout, is refused (STA-2788). */
  it.each(["preview", "staging", "production"])(
    "refuses on %s when the stream differs from the commit, before the runner loads",
    async (environment) => {
      vi.mocked(committedMigrationDrift).mockReturnValue([
        "services/billing/.stackra/migrations/0002_add_status.up.sql",
      ]);
      const result = await runCommandForTest(
        [DbMigrateCommand],
        ["db:migrate", "--env", environment],
      );
      expect(result.exitCode).toBe(1);
      expect(committedMigrationDrift).toHaveBeenCalledWith("/work");
      expect(result.stderr).toContain(`refused on ${environment}`);
      expect(result.stderr).toContain("0002_add_status.up.sql");
      expect(loadDatabaseRunner).not.toHaveBeenCalled();
      expect(migrate).not.toHaveBeenCalled();
    },
  );

  it("migrates on production when the stream is the commit's, or outside a checkout", async () => {
    migrate.mockResolvedValue({ applied: [] });
    for (const drift of [[], undefined]) {
      vi.mocked(committedMigrationDrift).mockReturnValue(drift);
      const result = await runCommandForTest(
        [DbMigrateCommand],
        ["db:migrate", "--env", "production"],
      );
      expect(result.exitCode).toBe(0);
    }
    expect(migrate).toHaveBeenCalledTimes(2);
  });

  /** Dev and test apply what gen just wrote, so a new migration runs before it is committed. */
  it.each(["dev", "test"])("never checks the stream on %s", async (environment) => {
    migrate.mockResolvedValue({ applied: ["0002_add_status"] });
    const result = await runCommandForTest(
      [DbMigrateCommand],
      ["db:migrate", "--env", environment],
    );
    expect(result.exitCode).toBe(0);
    expect(committedMigrationDrift).not.toHaveBeenCalled();
  });
});
