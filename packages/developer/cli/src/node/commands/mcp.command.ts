/**
 * Stackra file contract:
 * Purpose: `McpCommand`, `stackra mcp`: serves the local developer MCP over stdio until the client disconnects; its command
 *          tools run this CLI in-process with a capturing io. The body is `MCP_COMMAND`, unchanged.
 * Boundary: standard output carries the MCP protocol only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5); ADR 0506; ADR 0500 (decision 7); STA-2883.
 */
import { Command, type CommandIo } from "@stackra/console";

import { MCP_COMMAND } from "#node/constants/mcp-command.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Serves the local developer MCP. */
export class McpCommand extends Command({
  name: "mcp",
  description: MCP_COMMAND.summary,
  group: "Develop",
  hidden: true,
  bin: true,
  examples: ["stackra mcp"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = MCP_COMMAND;

  /** Serves until the client disconnects. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, MCP_COMMAND, { values: {} });
  }
}
