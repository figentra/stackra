/**
 * Stackra file contract:
 * Purpose: `CheckCommand`, the `check` tool of the local MCP: runs `stackra check --format=json` (the quality gate),
 *          all phases or the ones picked or skipped, optionally over the changed files only, past a failed phase, or
 *          with the tests, and returns the run with each finding as a diagnostic and their counts by phase and severity.
 * Boundary: runs through the CLI runner only and never fixes (`--fix` is not offered). `report` is false when the run
 *           printed no report (it failed before one).
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: the CLI runs every check; decision 5); STA-2873; STA-2886.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { List } from "@stackra/validation";

import { CHECK_PHASE_NAMES } from "#node/constants/check-phase-names.constant";
import { checkReport } from "#node/functions/check-report.function";
import { runToolCommand } from "#node/functions/run-tool-command.function";
import type { DevToolHost } from "#core/ports/dev-tool-host.port";

/** Runs the quality gate. */
export class CheckCommand extends Command({
  name: "check",
  description:
    "Run `stackra check` (config, format, spelling, secrets, structure, docs, lint, hooks, gen, typecheck, " +
    "catalogues, spec; tests on request); returns each finding",
  bin: true,
  tool: { readOnly: false, destructive: false, idempotent: true },
}) {
  /** Only these phases. */
  @Option({
    description: "Only these phases",
    choices: [...CHECK_PHASE_NAMES],
  })
  @List
  only: string[] = [];

  /** Not these phases. */
  @Option({
    description: "Skip these phases",
    choices: [...CHECK_PHASE_NAMES],
  })
  @List
  skip: string[] = [];

  /** Changed files only. */
  @Option({ description: "Only the files changed from origin/main" })
  affected = false;

  /** Past a failure. */
  @Option({ description: "Run every phase even after one fails" })
  keepGoing = false;

  /** With the tests. */
  @Option({ description: "Run the test phase too" })
  withTests = false;

  /** The server's runner and environment; absent when the kernel builds the command to read its fields. */
  private readonly host: DevToolHost | undefined;

  constructor(host: DevToolHost) {
    super();
    this.host = host;
  }

  /** Runs `stackra check --format=json` and reads its report. */
  handle(io: CommandIo): Promise<number> {
    return runToolCommand(
      io,
      this.host,
      [
        "check",
        "--format=json",
        ...(this.only.length > 0 ? [`--only=${this.only.join(",")}`] : []),
        ...(this.skip.length > 0 ? [`--skip=${this.skip.join(",")}`] : []),
        ...(this.affected ? ["--affected"] : []),
        ...(this.keepGoing ? ["--keep-going"] : []),
        ...(this.withTests ? ["--with-tests"] : []),
      ],
      { read: checkReport },
    );
  }
}
