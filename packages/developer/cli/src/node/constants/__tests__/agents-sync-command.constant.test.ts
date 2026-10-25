/**
 * Stackra file contract:
 * Purpose: unit tests of `AGENTS_SYNC_COMMAND`: it writes the project's generated agent file, `.mcp.json`, in the
 *          working directory and says whether it changed.
 * Boundary: test only; `syncMcpConfig` is replaced by a fake, so no file is written.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decisions 9 and 10).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { syncMcpConfig } from "@stackra/mcp/node";

import { AGENTS_SYNC_COMMAND } from "#node/constants/agents-sync-command.constant";
import { captureIo } from "#node/functions/capture-io.function";

vi.mock("@stackra/mcp/node", () => ({ syncMcpConfig: vi.fn() }));

const sync = async () => {
  const { io, output } = captureIo();
  const code = await AGENTS_SYNC_COMMAND.run({
    cwd: "/repo",
    io,
    values: {},
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output: output() };
};

describe("AGENTS_SYNC_COMMAND", () => {
  it("is `stackra agents sync` and renders .mcp.json in the working directory", async () => {
    expect(AGENTS_SYNC_COMMAND.name).toBe("agents sync");
    vi.mocked(syncMcpConfig).mockReturnValue({ file: "/repo/.mcp.json", changed: true });
    expect(await sync()).toEqual({ code: 0, output: "wrote /repo/.mcp.json\n" });
    expect(syncMcpConfig).toHaveBeenCalledWith("/repo");
    vi.mocked(syncMcpConfig).mockReturnValue({ file: "/repo/.mcp.json", changed: false });
    expect(await sync()).toEqual({ code: 0, output: "/repo/.mcp.json is up to date\n" });
  });
});
