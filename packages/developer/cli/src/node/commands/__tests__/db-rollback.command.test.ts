/**
 * Stackra file contract:
 * Purpose: unit tests of `DbRollbackCommand` on the console: it reverts the last batch on dev, preview and test and
 *          lists it (the `--json` data), and refuses staging and production with exit 1 before the runner loads.
 * Boundary: test only; the runner is a fake, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (2026-10-23 and 2026-10-24 notes); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DbRollbackCommand } from "#node/commands/db-rollback.command";
import { loadDatabaseRunner } from "#node/functions/load-database-runner.function";

vi.mock("#node/functions/load-database-runner.function", () => ({ loadDatabaseRunner: vi.fn() }));

const rollback = vi.fn();

beforeEach(() => {
  rollback.mockReset();
  vi.mocked(loadDatabaseRunner).mockReset();
  vi.mocked(loadDatabaseRunner).mockResolvedValue({ migrate: vi.fn(), rollback });
});

describe("DbRollbackCommand", () => {
  it.each(["dev", "preview", "test"])("reverts the last batch on %s", async (env) => {
    rollback.mockResolvedValue({ reverted: ["0002_add_status", "0001_create_orders"] });
    const result = await runCommandForTest([DbRollbackCommand], ["db:rollback", "--env", env]);
    expect(result.exitCode).toBe(0);
    expect(rollback).toHaveBeenCalledWith({ cwd: "/work", environment: env });
    expect(result.stdout).toContain("reverted 2");
    expect(result.stdout).toContain("0001_create_orders");
  });

  it("says so when there is nothing to revert, and returns the names under --json", async () => {
    rollback.mockResolvedValue({ reverted: [] });
    const text = await runCommandForTest([DbRollbackCommand], ["db:rollback", "--env", "dev"]);
    expect(text.exitCode).toBe(0);
    expect(text.stdout).toContain("nothing to revert");
    const json = await runCommandForTest(
      [DbRollbackCommand],
      ["db:rollback", "--env", "dev", "--json"],
    );
    expect(json.json).toEqual({ ok: true, data: { environment: "dev", reverted: [] } });
  });

  it.each(["staging", "production"])(
    "refuses %s with exit 1 without loading the runner",
    async (env) => {
      const result = await runCommandForTest(
        [DbRollbackCommand],
        ["db:rollback", "--env", env, "--json"],
      );
      expect(result.exitCode).toBe(1);
      const { error } = result.json as { error: { message: string; why: string } };
      expect(error.message).toContain(`refused on ${env}`);
      expect(error.why).toContain("production rolls forward");
      expect(loadDatabaseRunner).not.toHaveBeenCalled();
    },
  );
});
