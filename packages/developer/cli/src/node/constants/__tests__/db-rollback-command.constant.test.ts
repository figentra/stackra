/**
 * Stackra file contract:
 * Purpose: unit tests of `DB_ROLLBACK_COMMAND`: it reverts the last batch on dev, preview and test, and refuses
 *          staging and production before the runner loads.
 * Boundary: test only; the runner is a fake, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (2026-10-23 and 2026-10-24 notes).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DB_ROLLBACK_COMMAND } from "#node/constants/db-rollback-command.constant";
import { captureIo } from "#node/functions/capture-io.function";
import { loadDatabaseRunner } from "#node/functions/load-database-runner.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("#node/functions/load-database-runner.function", () => ({ loadDatabaseRunner: vi.fn() }));

const rollback = vi.fn();

beforeEach(() => {
  rollback.mockReset();
  vi.mocked(loadDatabaseRunner).mockReset();
  vi.mocked(loadDatabaseRunner).mockResolvedValue({ migrate: vi.fn(), rollback });
});

const run = (values: CliContext["values"]) => {
  const { io, output } = captureIo();
  const code = DB_ROLLBACK_COMMAND.run({
    cwd: "/repo/apps/api",
    io,
    values,
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output };
};

describe("DB_ROLLBACK_COMMAND", () => {
  it.each(["dev", "preview", "test"])("reverts the last batch on %s", async (env) => {
    rollback.mockResolvedValue({ reverted: ["0002_add_status", "0001_create_orders"] });
    const { code, output } = run({ env });

    expect(await code).toBe(0);
    expect(rollback).toHaveBeenCalledWith({ cwd: "/repo/apps/api", environment: env });
    expect(output()).toContain("reverted 2");
  });

  it("says so when there is nothing to revert", async () => {
    rollback.mockResolvedValue({ reverted: [] });
    const { code, output } = run({ env: "dev" });

    expect(await code).toBe(0);
    expect(output()).toContain("nothing to revert");
  });

  it.each(["staging", "production"])("refuses %s without loading the runner", async (env) => {
    const { code, output } = run({ env });

    expect(await code).toBe(1);
    expect(output()).toContain("production rolls forward");
    expect(loadDatabaseRunner).not.toHaveBeenCalled();
  });
});
