/**
 * Stackra file contract:
 * Purpose: unit tests of `AGENTS_CHECK_COMMAND`: it passes when `.mcp.json` matches `.mcp.yaml` and fails with the
 *          fix when it drifted.
 * Boundary: test only; `checkMcpConfig` is replaced by a fake, so no file is read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 10 and enforcement).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { checkMcpConfig } from "@stackra/mcp/node";

import { AGENTS_CHECK_COMMAND } from "#node/constants/agents-check-command.constant";
import { captureIo } from "#node/functions/capture-io.function";

vi.mock("@stackra/mcp/node", () => ({ checkMcpConfig: vi.fn() }));

const check = async () => {
  const { io, output } = captureIo();
  const code = await AGENTS_CHECK_COMMAND.run({
    cwd: "/repo",
    io,
    values: {},
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output: output() };
};

describe("AGENTS_CHECK_COMMAND", () => {
  it("passes when .mcp.json matches and fails with the fix on drift", async () => {
    expect(AGENTS_CHECK_COMMAND.name).toBe("agents check");
    vi.mocked(checkMcpConfig).mockReturnValue(true);
    expect(await check()).toEqual({ code: 0, output: ".mcp.json matches .mcp.yaml\n" });
    expect(checkMcpConfig).toHaveBeenCalledWith("/repo");
    vi.mocked(checkMcpConfig).mockReturnValue(false);
    const drifted = await check();
    expect(drifted.code).toBe(1);
    expect(drifted.output).toContain("run `stackra agents sync`");
  });
});
