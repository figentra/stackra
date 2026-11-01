/**
 * Stackra file contract:
 * Purpose: proves `db:migrate` applies through the runner, returns the applied names as --json data, passes `--env` and `--cwd`,
 *          records an audit entry, and is refused when no `CommandAudit` is bound.
 * Boundary: test only; the `DatabaseRunner` is a fake served through the container, so no Postgres runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1731 spec FR-001 and FR-015.
 */
// @covers sta-1731:FR-001 sta-1731:FR-015
import { MemoryCommandAuditDriver, runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DbMigrateCommand } from "#node/commands/db-migrate.command";

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
