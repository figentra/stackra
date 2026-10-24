/**
 * Stackra file contract:
 * Purpose: `MCP_COMMAND`, `stackra mcp`: serves the local developer MCP over stdio until the client disconnects. Its
 *          command tools run through this CLI in-process with a capturing io, so an assistant's `gen`, `validate` or
 *          `verify` passes the same commands and gates as a person's.
 * Boundary: standard output carries the MCP protocol only; command output is captured and returned as tool results.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode shares one core with the CLI); R-29 (proxy the local Encore
 *                     tools).
 */
import { serveLocalMcp } from "@stackra/mcp/node";

import { captureIo } from "#node/functions/capture-io.function";
import { cliVersion } from "#node/functions/cli-version.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra mcp` command definition. */
export const MCP_COMMAND: CliCommand = {
  name: "mcp",
  summary: "Serve the local developer MCP over stdio",
  usage: "stackra mcp",
  async run({ cwd, cli }) {
    await serveLocalMcp({
      version: cliVersion(),
      root: cwd,
      run: async (args) => {
        const { io, output } = captureIo();
        const exitCode = await cli(args, io);
        return { exitCode, output: output() };
      },
    });
    return 0;
  },
};
