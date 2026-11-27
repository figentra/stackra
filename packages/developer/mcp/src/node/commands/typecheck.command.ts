/**
 * Stackra file contract:
 * Purpose: `TypecheckCommand`, the `typecheck` tool of the local MCP: runs `stackra typecheck` (gen first, then the
 *          member's type check; every member through Turborepo at the root) and returns the run with each TypeScript
 *          diagnostic (file, line, column, code, message) read from its output.
 * Boundary: runs through the CLI runner only; it writes what gen writes and nothing else.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: run and explain failures); STA-2873.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { diagnosticsOf } from "#node/functions/diagnostics-of.function";
import { parseDiagnostics } from "#node/functions/parse-diagnostics.function";
import { runToolCommand } from "#node/functions/run-tool-command.function";
import type { DevToolHost } from "#core/ports/dev-tool-host.port";

/** Runs `stackra typecheck` as a tool. */
export class TypecheckCommand extends Command({
  name: "typecheck",
  description:
    "Run `stackra typecheck` (gen, then the type check) for the repository or one member; returns each diagnostic",
  bin: true,
  tool: { readOnly: false, destructive: false, idempotent: true },
}) {
  /** The member to run in; every member when absent. */
  @Option({
    description: "A member: its key (`commerce`), package name or folder; every member when absent",
  })
  @Str
  member?: string;

  /** The server's runner and environment; absent when the kernel builds the command to read its fields. */
  private readonly host: DevToolHost | undefined;

  constructor(host: DevToolHost) {
    super();
    this.host = host;
  }

  /** Runs `stackra typecheck` and reads its diagnostics. */
  handle(io: CommandIo): Promise<number> {
    return runToolCommand(io, this.host, ["typecheck"], {
      member: this.member,
      read: (output) => diagnosticsOf(parseDiagnostics(output)),
    });
  }
}
