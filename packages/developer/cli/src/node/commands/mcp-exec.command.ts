/**
 * Stackra file contract:
 * Purpose: `McpExecCommand`, `stackra mcp exec -- <command> [args…]`: starts an MCP server with its secrets (`$NAME`
 *          decrypted by `sops exec-env` from the local secrets clone); its exit code is the server's. The body is
 *          `MCP_EXEC_COMMAND`, unchanged.
 * Boundary: no value passes through this process, its output or its arguments.
 * Runtime: node
 * Governing contract: ADR 0173; ADR 0257; ADR 0282 (decision 3); ADR 0525; ADR 0506; ADR 0500 (decision 7); STA-2883.
 */
import { Argument, Command, type CommandIo } from "@stackra/console";
import { List } from "@stackra/validation";

import { MCP_EXEC_COMMAND } from "#node/constants/mcp-exec-command.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Starts an MCP server with its secrets. */
export class McpExecCommand extends Command({
  name: "mcp:exec",
  description: MCP_EXEC_COMMAND.summary,
  group: "Develop",
  hidden: true,
  bin: true,
  examples: ["stackra mcp exec -- npx -y @acme/mcp-server --token '$ACME_TOKEN'"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = MCP_EXEC_COMMAND;

  /** The server command and its arguments, after -- */
  @Argument({ description: "The server command and its arguments, after --" })
  @List
  command: string[] = [];

  /** Runs the server; the exit code is its own. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, MCP_EXEC_COMMAND, { values: {}, rest: this.command });
  }
}
