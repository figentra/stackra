/**
 * Stackra file contract:
 * Purpose: unit tests of `AgentsSyncCommand` on the console: `stackra agents sync` renders `.mcp.json` in the working
 *          directory, says whether it changed, and returns both as the `--json` data.
 * Boundary: test only; `syncMcpConfig` is replaced by a fake, so no file is written.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 9 and 10); STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { syncMcpConfig } from "@stackra/mcp/node";

import { AgentsSyncCommand } from "#node/commands/agents-sync.command";

vi.mock("@stackra/mcp/node", () => ({ syncMcpConfig: vi.fn() }));

describe("AgentsSyncCommand", () => {
  it("runs as `agents sync` and renders .mcp.json in the working directory", async () => {
    vi.mocked(syncMcpConfig).mockReturnValue({ file: "/work/.mcp.json", changed: true });
    const wrote = await runCommandForTest([AgentsSyncCommand], ["agents", "sync"]);
    expect(wrote.exitCode).toBe(0);
    expect(wrote.stdout).toContain("wrote /work/.mcp.json");
    expect(syncMcpConfig).toHaveBeenCalledWith("/work");

    vi.mocked(syncMcpConfig).mockReturnValue({ file: "/work/.mcp.json", changed: false });
    const same = await runCommandForTest([AgentsSyncCommand], ["agents:sync", "--json"]);
    expect(same.json).toEqual({ ok: true, data: { file: "/work/.mcp.json", changed: false } });
  });
});
