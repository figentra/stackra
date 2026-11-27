/**
 * Stackra file contract:
 * Purpose: `ValidateCommand`, the `validate` tool of the local MCP: runs `stackra validate` (the config, structure,
 *          docs, catalogue and spec checks) and returns the run with its output.
 * Boundary: runs through the CLI runner only; reads the checkout and writes nothing.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: run validate and explain failures); ADR 0129; STA-2873.
 */
import { Command, type CommandIo } from "@stackra/console";

import { runToolCommand } from "#node/functions/run-tool-command.function";
import type { DevToolHost } from "#core/ports/dev-tool-host.port";

/** Runs `stackra validate` as a tool. */
export class ValidateCommand extends Command({
  name: "validate",
  description:
    "Run `stackra validate` (config, structure, docs, catalogues, spec) and return its findings",
  bin: true,
  tool: { readOnly: true },
}) {
  /** The server's runner and environment; absent when the kernel builds the command to read its fields. */
  private readonly host: DevToolHost | undefined;

  constructor(host: DevToolHost) {
    super();
    this.host = host;
  }

  /** Runs `stackra validate`. */
  handle(io: CommandIo): Promise<number> {
    return runToolCommand(io, this.host, ["validate"]);
  }
}
