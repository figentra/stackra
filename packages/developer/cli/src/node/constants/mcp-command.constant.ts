/**
 * Stackra file contract:
 * Purpose: `MCP_COMMAND`, `stackra mcp`: serves the local developer MCP over stdio until the client disconnects. Its
 *          command tools run through this CLI in-process with a capturing io, so an assistant's `gen`, `validate` or
 *          `verify` passes the same commands and gates as a person's. The read-only database inspections (`db_schema`,
 *          `db_query`, `db_migrations_status`) and `doctor` are served from their command definitions.
 * Boundary: standard output carries the MCP protocol only; command output is captured and returned as tool results.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: local mode shares one core with the CLI; query the local database); R-29
 *                     (proxy the local Encore tools); STA-2906.
 */
import { toolsOf } from "@stackra/console";
import { NodeProcessRunnerDriver } from "@stackra/console/node";
import { serveLocalMcp } from "@stackra/mcp/node";

import { DbMigrationsStatusCommand } from "#node/commands/db-migrations-status.command";
import { DbQueryCommand } from "#node/commands/db-query.command";
import { DbSchemaCommand } from "#node/commands/db-schema.command";
import { DoctorCommand } from "#node/commands/doctor.command";
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
      // A converted command is served from its own definition; the rest stay on LOCAL_TOOLS until they are converted.
      tools: toolsOf(
        {
          name: "stackra",
          version: cliVersion(),
          commands: [DoctorCommand, DbSchemaCommand, DbQueryCommand, DbMigrationsStatusCommand],
        },
        { cwd, process: () => new NodeProcessRunnerDriver() },
      ),
      run: async (args) => {
        const { io, output } = captureIo();
        const exitCode = await cli(args, io);
        return { exitCode, output: output() };
      },
    });
    return 0;
  },
};
