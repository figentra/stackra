/**
 * Stackra file contract:
 * Purpose: `MCP_COMMAND`, `stackra mcp`: serves the local developer MCP over stdio until the client disconnects. Its
 *          command tools run through this CLI in-process with a capturing io (in a member's folder when the tool names
 *          one), so an assistant's `gen`, `validate`, `check` or `test` passes the same commands and gates as a
 *          person's. The CLI's own `tool` commands (`doctor`, `ls`) join the server's built-in tools.
 * Boundary: standard output carries the MCP protocol only; command output is captured and returned as tool results.
 *           It serves with `STACKRA_ENVIRONMENT=dev` when the variable is unset or empty (the server itself takes
 *           unset as deployed and refuses writes); a value that is set passes through unchanged, so a deployed name
 *           still refuses.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode shares one core with the CLI); R-29 (proxy the local Encore
 *                     tools).
 */
import { toolsOf } from "@stackra/console";
import { NodeProcessRunnerDriver } from "@stackra/console/node";
import { serveLocalMcp } from "@stackra/mcp/node";

import { DoctorCommand } from "#node/commands/doctor.command";
import { LsCommand } from "#node/commands/ls.command";
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
      // The launcher says it is local; the server never assumes it (fail closed).
      env: { ...process.env, STACKRA_ENVIRONMENT: process.env["STACKRA_ENVIRONMENT"] || "dev" },
      // The CLI's own tool commands, served from their definitions; one named like a built-in tool replaces it.
      tools: toolsOf(
        { name: "stackra", version: cliVersion(), commands: [DoctorCommand, LsCommand] },
        { cwd, process: () => new NodeProcessRunnerDriver() },
      ),
      run: async (args, at) => {
        const { io, output } = captureIo();
        const exitCode = await cli(args, io, at);
        return { exitCode, output: output() };
      },
    });
    return 0;
  },
};
