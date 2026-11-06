/**
 * Stackra file contract:
 * Purpose: unit tests of `AgentsCheckCommand` on the console: it runs as `agents check` and `agents:check`, passes when
 *          `.mcp.json` matches `.mcp.yaml` in the working directory, and fails with 1 and the fix when it drifted.
 * Boundary: test only; `checkMcpConfig` is replaced by a fake, so no file is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 10 and enforcement); ADR 0506; STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { checkMcpConfig } from "@stackra/mcp/node";

import { AgentsCheckCommand } from "#node/commands/agents-check.command";

vi.mock("@stackra/mcp/node", () => ({ checkMcpConfig: vi.fn() }));

describe("AgentsCheckCommand", () => {
  it("passes when .mcp.json matches and fails with the fix on drift", async () => {
    vi.mocked(checkMcpConfig).mockReturnValue(true);
    const clean = await runCommandForTest([AgentsCheckCommand], ["agents", "check"], {
      cwd: "/repo",
    });
    expect(clean.exitCode).toBe(0);
    expect(clean.stdout).toContain(".mcp.json matches .mcp.yaml");
    expect(checkMcpConfig).toHaveBeenCalledWith("/repo");
    vi.mocked(checkMcpConfig).mockReturnValue(false);
    const drifted = await runCommandForTest([AgentsCheckCommand], ["agents:check"]);
    expect(drifted.exitCode).toBe(1);
    expect(drifted.stdout).toContain("run `stackra agents sync`");
  });
});
