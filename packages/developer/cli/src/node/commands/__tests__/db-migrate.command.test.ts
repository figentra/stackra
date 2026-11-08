/**
 * Stackra file contract:
 * Purpose: unit tests of `DbMigrateCommand` on the console: it runs the member's runner with the environment, lists
 *          what it applied (the `--json` data), says so when nothing is pending, targets dev by default and refuses an
 *          unknown environment with exit 2 before the runner loads.
 * Boundary: test only; the runner is a fake, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 2 as amended); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DbMigrateCommand } from "#node/commands/db-migrate.command";
import { loadDatabaseRunner } from "#node/functions/load-database-runner.function";

vi.mock("#node/functions/load-database-runner.function", () => ({ loadDatabaseRunner: vi.fn() }));

const migrate = vi.fn();

beforeEach(() => {
  migrate.mockReset();
  vi.mocked(loadDatabaseRunner).mockReset();
  vi.mocked(loadDatabaseRunner).mockResolvedValue({ migrate, rollback: vi.fn() });
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
});
