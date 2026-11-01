/**
 * Stackra file contract:
 * Purpose: proves `db:rollback` needs `--force` without a terminal (exit 2 naming it), asks when interactive and stops on no,
 *          reverts with `--force`, and records an audit entry.
 * Boundary: test only; the `DatabaseRunner` is a fake served through the container, so no Postgres runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1731 spec FR-013 and FR-015.
 */
// @covers sta-1731:FR-013 sta-1731:FR-015
import { MemoryCommandAuditDriver, runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DbRollbackCommand } from "#node/commands/db-rollback.command";

/** A container that serves `runner` as the `DatabaseRunner` and builds each command with it. */
const serving =
  (runner: object, audited = true) =>
  async () => ({
    get: <T extends object>(type: abstract new (...args: never[]) => T): T =>
      Reflect.construct(type, [runner]) as T,
    has: () => audited,
    close: async () => {},
  });

describe("DbRollbackCommand", () => {
  it("exits 2 naming --force when it cannot ask", async () => {
    const runner = { rollback: vi.fn(async () => ({ reverted: [] })) };
    const result = await runCommandForTest([DbRollbackCommand], ["db:rollback"], {
      audit: new MemoryCommandAuditDriver(),
      container: serving(runner),
    });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("--force");
    expect(runner.rollback).not.toHaveBeenCalled();
  });

  it("reverts with --force and audits it", async () => {
    const runner = { rollback: vi.fn(async () => ({ reverted: ["0002_orders_lines"] })) };
    const audit = new MemoryCommandAuditDriver();
    const result = await runCommandForTest(
      [DbRollbackCommand],
      ["db:rollback", "--force", "--env", "dev", "--json"],
      { audit, container: serving(runner) },
    );
    expect(result.json).toEqual({ ok: true, data: { reverted: ["0002_orders_lines"] } });
    expect(audit.entries[0]).toMatchObject({ command: "db:rollback", outcome: "ok" });
    expect(audit.entries[0]?.values).toMatchObject({ force: true });
  });

  it("reverts when the Operator confirms and stops on no", async () => {
    const runner = { rollback: vi.fn(async () => ({ reverted: ["0002_orders_lines"] })) };
    const options = { audit: new MemoryCommandAuditDriver(), container: serving(runner) };
    await runCommandForTest([DbRollbackCommand], ["db:rollback"], { ...options, answers: [false] });
    expect(runner.rollback).not.toHaveBeenCalled();
    await runCommandForTest([DbRollbackCommand], ["db:rollback"], { ...options, answers: [true] });
    expect(runner.rollback).toHaveBeenCalledOnce();
  });
});
