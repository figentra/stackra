/**
 * Stackra file contract:
 * Purpose: `VerifyCommand`, the `verify` tool of the local MCP: runs `stackra verify --format=json` (every check
 *          phase, tests included), optionally over the changed files only or past a failed phase, and returns the run
 *          with its findings and their counts by phase and severity.
 * Boundary: runs through the CLI runner only and never fixes. `findings` is null when the run printed no report.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: run verify and explain failures); STA-2873.
 */
import { Command, Option, type CommandIo } from "@stackra/console";

import { checkReport } from "#node/functions/check-report.function";
import { runToolCommand } from "#node/functions/run-tool-command.function";
import type { DevToolHost } from "#core/ports/dev-tool-host.port";

/** Runs the full gate. */
export class VerifyCommand extends Command({
  name: "verify",
  description: "Run `stackra verify` (every check phase, tests included); returns each finding",
  bin: true,
  tool: { readOnly: false, destructive: false, idempotent: true },
}) {
  /** Changed files only. */
  @Option({ description: "Only the files changed from origin/main" })
  affected = false;

  /** Past a failure. */
  @Option({ description: "Run every phase even after one fails" })
  keepGoing = false;

  /** The server's runner and environment; absent when the kernel builds the command to read its fields. */
  private readonly host: DevToolHost | undefined;

  constructor(host: DevToolHost) {
    super();
    this.host = host;
  }

  /** Runs `stackra verify --format=json` and reads its report. */
  handle(io: CommandIo): Promise<number> {
    return runToolCommand(
      io,
      this.host,
      [
        "verify",
        "--format=json",
        ...(this.affected ? ["--affected"] : []),
        ...(this.keepGoing ? ["--keep-going"] : []),
      ],
      { read: checkReport },
    );
  }
}
