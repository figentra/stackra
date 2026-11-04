/**
 * Stackra file contract:
 * Purpose: unit tests of `VerifyCommand`: it runs every check phase with the tests (`withTests`), and it is a
 *          local MCP tool, not read-only, whose result is its `--json` data.
 * Boundary: test only; `runCheck` is replaced by a fake, so no phase runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5); ADR 0506; STA-1966.
 */
import { toolsOf } from "@stackra/console";
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { VerifyCommand } from "#node/commands/verify.command";
import { runCheck } from "#node/functions/run-check.function";

vi.mock("#node/functions/run-check.function", () => ({
  runCheck: vi.fn(async () => ({ code: 0, findings: [], phases: [] })),
}));

describe("VerifyCommand", () => {
  it("runs the check phases with the tests", async () => {
    const result = await runCommandForTest([VerifyCommand], ["verify"]);
    expect(result.exitCode).toBe(0);
    expect(vi.mocked(runCheck).mock.calls[0]?.[1]).toEqual({ withTests: true });
  });

  it("is a local MCP tool that may write, answering with its --json data", async () => {
    const [tool] = toolsOf(
      { name: "stackra", version: "0.0.0", commands: [VerifyCommand] },
      { cwd: "/work" },
    );
    expect([tool?.name, tool?.readOnly]).toEqual(["verify", false]);
    expect(await tool?.invoke({})).toEqual({
      document: { ok: true, data: { findings: [], phases: [] } },
      exitCode: 0,
    });
  });
});
