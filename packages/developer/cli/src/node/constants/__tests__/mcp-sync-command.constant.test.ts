/**
 * Stackra file contract:
 * Purpose: unit tests of `MCP_SYNC_COMMAND`: it renders `.mcp.json` in the working directory and says whether it
 *          wrote the file.
 * Boundary: test only; `syncMcpConfig` is replaced by a fake, so no file is written.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 10).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { syncMcpConfig } from "@stackra/mcp/node";

import { MCP_SYNC_COMMAND } from "#node/constants/mcp-sync-command.constant";
import { captureIo } from "#node/functions/capture-io.function";

vi.mock("@stackra/mcp/node", () => ({ syncMcpConfig: vi.fn() }));

const sync = async () => {
  const { io, output } = captureIo();
  const code = await MCP_SYNC_COMMAND.run({
    cwd: "/repo",
    io,
    values: {},
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output: output() };
};

describe("MCP_SYNC_COMMAND", () => {
  it("is `stackra mcp sync` and renders .mcp.json in the working directory", async () => {
    expect(MCP_SYNC_COMMAND.name).toBe("mcp sync");
    vi.mocked(syncMcpConfig).mockReturnValue({ file: "/repo/.mcp.json", changed: true });
    expect(await sync()).toEqual({ code: 0, output: "wrote /repo/.mcp.json\n" });
    expect(syncMcpConfig).toHaveBeenCalledWith("/repo");
    vi.mocked(syncMcpConfig).mockReturnValue({ file: "/repo/.mcp.json", changed: false });
    expect(await sync()).toEqual({ code: 0, output: "/repo/.mcp.json is up to date\n" });
  });
});
