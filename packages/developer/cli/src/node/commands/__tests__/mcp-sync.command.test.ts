/**
 * Stackra file contract:
 * Purpose: unit tests of `McpSyncCommand` on the console: `stackra mcp sync` renders `.mcp.json` in the working
 *          directory, says whether it wrote the file, returns both as the `--json` data, and exits 1 when `.mcp.yaml`
 *          is invalid.
 * Boundary: test only; `syncMcpConfig` is replaced by a fake, so no file is written.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 10); STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { syncMcpConfig } from "@stackra/mcp/node";

import { McpSyncCommand } from "#node/commands/mcp-sync.command";

vi.mock("@stackra/mcp/node", () => ({ syncMcpConfig: vi.fn() }));

describe("McpSyncCommand", () => {
  it("runs as `mcp sync` and renders .mcp.json in the working directory", async () => {
    vi.mocked(syncMcpConfig).mockReturnValue({ file: "/work/.mcp.json", changed: true });
    const wrote = await runCommandForTest([McpSyncCommand], ["mcp", "sync"]);
    expect(wrote.exitCode).toBe(0);
    expect(wrote.stdout).toContain("wrote /work/.mcp.json");
    expect(syncMcpConfig).toHaveBeenCalledWith("/work");

    vi.mocked(syncMcpConfig).mockReturnValue({ file: "/work/.mcp.json", changed: false });
    const same = await runCommandForTest([McpSyncCommand], ["mcp:sync", "--json"]);
    expect(same.json).toEqual({ ok: true, data: { file: "/work/.mcp.json", changed: false } });
  });

  it("exits 1 when .mcp.yaml is invalid", async () => {
    vi.mocked(syncMcpConfig).mockImplementation(() => {
      throw new Error(".mcp.yaml: mcpServers.x.command is required");
    });
    const result = await runCommandForTest([McpSyncCommand], ["mcp:sync"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout + result.stderr).toContain("mcpServers.x.command is required");
  });
});
