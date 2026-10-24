/**
 * Stackra file contract:
 * Purpose: unit tests of `MCP_COMMAND`: it serves the local MCP with the CLI version and the working directory, and
 *          its runner runs the CLI in-process with a capturing io, returning the exit code and the output.
 * Boundary: test only; `serveLocalMcp` is replaced by a fake, so no stdio server starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import { serveLocalMcp } from "@stackra/mcp/node";

import { MCP_COMMAND } from "#node/constants/mcp-command.constant";
import { captureIo } from "#node/functions/capture-io.function";
import { cliVersion } from "#node/functions/cli-version.function";
import type { CliIo } from "#node/types/cli-io.type";

vi.mock("@stackra/mcp/node", () => ({ serveLocalMcp: vi.fn(async () => undefined) }));

describe("MCP_COMMAND", () => {
  it("serves the local MCP with the CLI version, the root and an in-process runner", async () => {
    const cli = vi.fn(async (_args: readonly string[], io: CliIo) => {
      io.out("checked\n");
      return 3;
    });
    expect(MCP_COMMAND.name).toBe("mcp");
    expect(
      await MCP_COMMAND.run({
        cwd: "/repo",
        io: captureIo().io,
        values: {},
        positionals: [],
        rest: [],
        cli,
      }),
    ).toBe(0);
    const options = vi.mocked(serveLocalMcp).mock.calls[0]?.[0];
    expect(options?.version).toBe(cliVersion());
    expect(options?.root).toBe("/repo");
    expect(await options?.run?.(["gen", "--check"])).toEqual({ exitCode: 3, output: "checked\n" });
    expect(cli.mock.calls[0]?.[0]).toEqual(["gen", "--check"]);
    expect(cli.mock.calls[0]?.[1].inherit).toBe(false);
  });
});
