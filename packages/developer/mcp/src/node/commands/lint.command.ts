/**
 * Stackra file contract:
 * Purpose: `LintCommand`, the `lint` tool of the local MCP: runs `stackra lint` (oxlint; a docs app builds its site
 *          first) for the repository or one member and returns the run with each finding (file, line, column, rule,
 *          message, severity) read from its output.
 * Boundary: runs through the CLI runner only and never fixes: no `--fix` reaches the linter. Not read-only, because a
 *           docs app's lint regenerates and builds its site.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: run and explain failures); STA-2873; STA-2886.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { parseDiagnostics } from "#node/functions/parse-diagnostics.function";
import { runToolCommand } from "#node/functions/run-tool-command.function";
import type { DevToolHost } from "#core/ports/dev-tool-host.port";

/** Runs `stackra lint` as a tool. */
export class LintCommand extends Command({
  name: "lint",
  description:
    "Run `stackra lint` (oxlint, no fixes) for the repository or one member; returns each finding",
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

  /** Runs `stackra lint` and reads its findings. */
  handle(io: CommandIo): Promise<number> {
    return runToolCommand(io, this.host, ["lint"], {
      member: this.member,
      read: (output) => ({ diagnostics: parseDiagnostics(output, "lint") }),
    });
  }
}
