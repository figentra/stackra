/**
 * Stackra file contract:
 * Purpose: proves `db:seed --pack` reads the pack's ledger records through the runner and records an audit entry.
 * Boundary: test only; the `DatabaseRunner` is a fake served through the container, so no Postgres runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1731 spec FR-001 and FR-015.
 */
// @covers sta-1731:FR-001 sta-1731:FR-015
import { MemoryCommandAuditDriver, runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DbSeedCommand } from "#node/commands/db-seed.command";

/** A container that serves `runner` as the `DatabaseRunner` and builds each command with it. */
const serving =
  (runner: object, audited = true) =>
  async () => ({
    get: <T extends object>(type: abstract new (...args: never[]) => T): T =>
      Reflect.construct(type, [runner]) as T,
    has: () => audited,
    close: async () => {},
  });

describe("DbSeedCommand", () => {
  it("lists the pack's records and audits the run", async () => {
    const records = [{ kind: "role", key: "admin", owner: "seed", hash: "h" }];
    const runner = { seedState: vi.fn(async () => records) };
    const audit = new MemoryCommandAuditDriver();
    const result = await runCommandForTest(
      [DbSeedCommand],
      ["db:seed", "--pack", "seed-pack:iam", "--env", "dev", "--json"],
      { audit, container: serving(runner) },
    );
    expect(result.json).toMatchObject({ ok: true, data: { pack: "seed-pack:iam", records } });
    expect(runner.seedState).toHaveBeenCalledWith(
      expect.objectContaining({ pack: "seed-pack:iam", environment: "dev" }),
    );
    expect(audit.entries[0]).toMatchObject({ command: "db:seed", outcome: "ok" });
  });
});
