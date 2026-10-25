/**
 * Stackra file contract:
 * Purpose: unit tests of `DB_MIGRATE_COMMAND`: it runs the member's runner with the environment, lists what it
 *          applied, says so when nothing is pending, and refuses an unknown environment.
 * Boundary: test only; the runner is a fake, so no database is touched.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (decision 2 as amended).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DB_MIGRATE_COMMAND } from "#node/constants/db-migrate-command.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { loadDatabaseRunner } from "#node/functions/load-database-runner.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("#node/functions/load-database-runner.function", () => ({ loadDatabaseRunner: vi.fn() }));

const migrate = vi.fn();

beforeEach(() => {
  migrate.mockReset();
  vi.mocked(loadDatabaseRunner).mockReset();
  vi.mocked(loadDatabaseRunner).mockResolvedValue({ migrate, rollback: vi.fn() });
});

const run = (values: CliContext["values"] = {}) => {
  const { io, output } = captureIo();
  const code = DB_MIGRATE_COMMAND.run({
    cwd: "/repo/apps/api",
    io,
    values,
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output };
};

describe("DB_MIGRATE_COMMAND", () => {
  it("applies the pending migrations in the member's context and lists them", async () => {
    migrate.mockResolvedValue({ applied: ["0001_create_orders", "0002_add_status"] });
    const { code, output } = run({ env: "staging" });

    expect(await code).toBe(0);
    expect(loadDatabaseRunner).toHaveBeenCalledWith("/repo/apps/api");
    expect(migrate).toHaveBeenCalledWith({ cwd: "/repo/apps/api", environment: "staging" });
    expect(output()).toContain("applied 2");
    expect(output()).toContain("0002_add_status");
  });

  it("says so when nothing is pending", async () => {
    migrate.mockResolvedValue({ applied: [] });
    const { code, output } = run({ env: "production" });

    expect(await code).toBe(0);
    expect(output()).toContain("no pending migrations");
  });

  it("targets dev by default and refuses an unknown environment", async () => {
    vi.stubEnv("STACKRA_ENVIRONMENT", undefined);
    migrate.mockResolvedValue({ applied: [] });
    await run().code;
    expect(migrate).toHaveBeenCalledWith({ cwd: "/repo/apps/api", environment: "dev" });

    await expect(run({ env: "qa" }).code).rejects.toThrow(CliUsageError);
    vi.unstubAllEnvs();
  });
});
