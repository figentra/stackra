/**
 * Stackra file contract:
 * Purpose: proves `db:status` lists each file with whether it is applied, with the version and dirty flag, and records an audit
 *          entry.
 * Boundary: test only; the `DatabaseRunner` is a fake served through the container, so no Postgres runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1731 spec FR-001 and FR-015.
 */
// @covers sta-1731:FR-001 sta-1731:FR-015
import { MemoryCommandAuditDriver, runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DbStatusCommand } from "#node/commands/db-status.command";

/** A container that serves `runner` as the `DatabaseRunner` and builds each command with it. */
const serving =
  (runner: object, audited = true) =>
  async () => ({
    get: <T extends object>(type: abstract new (...args: never[]) => T): T =>
      Reflect.construct(type, [runner]) as T,
    has: () => audited,
    close: async () => {},
  });

describe("DbStatusCommand", () => {
  it("marks the applied files and audits the run", async () => {
    const migrations = [
      { name: "0001_a", applied: true },
      { name: "0002_b", applied: false },
    ];
    const runner = { status: vi.fn(async () => ({ version: 1, dirty: false, migrations })) };
    const audit = new MemoryCommandAuditDriver();
    const result = await runCommandForTest([DbStatusCommand], ["db:status", "--json"], {
      audit,
      container: serving(runner),
    });
    expect(result.json).toMatchObject({ ok: true, data: { version: 1, dirty: false, migrations } });
    expect(audit.entries[0]).toMatchObject({ command: "db:status", outcome: "ok" });
  });
});
