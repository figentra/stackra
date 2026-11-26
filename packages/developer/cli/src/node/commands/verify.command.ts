/**
 * Stackra file contract:
 * Purpose: `VerifyCommand`, `stackra verify`: `stackra check --with-tests`: every phase, the tests included. Its flags are `stackra check`'s; a flag on the command line wins over
 *          the preset. `--json`: `{ phases, findings }`, each phase (phase, status, findings, fixable, durationMs) and every
 *          finding, whatever `--format` says (`runCheck` reports them).
 * Boundary: the body is `checkCommand("verify")` over `runCheck`, unchanged; phases return findings and never print.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); the quality-gate coverage audit of 2026-10-27; ADR 0506; ADR 0500
 *                     (decision 7); STA-2883.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { checkCommand } from "#node/functions/check-command.function";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The body: `runCheck` with the preset. */
const BODY = checkCommand(
  "verify",
  "Run every check phase, tests included (`stackra check --with-tests`)",
  { withTests: true },
);

/** Runs every phase, tests included. */
export class VerifyCommand extends Command({
  name: "verify",
  description: BODY.summary,
  group: "Quality",
  hidden: true,
  bin: true,
  examples: ["stackra verify"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = BODY;

  /** Apply the fixes the tools can make. */
  @Option({
    description: "Apply the fixes the tools can make (format, lint), then report what is left",
  })
  fix = false;

  /** Only changed files. */
  @Option({ description: "Check only the files changed since --base" })
  affected = false;

  /** The phases to run. */
  @Option({ description: "Run only these phases, comma-separated (see `stackra check --help`)" })
  @Str
  only?: string;

  /** The phases to leave out. */
  @Option({ description: "Leave these phases out, comma-separated" })
  @Str
  skip?: string;

  /** How the findings print. */
  @Option({
    description: "text (default), json (the findings alone) or github (annotations)",
    choices: ["text", "json", "github"],
  })
  @Str
  format?: string;

  /** The base of --affected. */
  @Option({ description: "The ref --affected compares with (default: origin/main)" })
  @Str
  base?: string;

  /** Run the tests too; `verify` presets it, so it runs them either way. */
  @Option({ description: "Run the test phase too (verify always does)" })
  withTests = false;

  /** Keep going after a failed phase. */
  @Option({ description: "Run every phase even after one fails" })
  keepGoing = false;

  /** Runs the phases; the exit code is 1 when one failed. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, BODY, {
      values: {
        fix: this.fix,
        affected: this.affected,
        only: this.only,
        skip: this.skip,
        format: this.format,
        base: this.base,
        "with-tests": this.withTests,
        "keep-going": this.keepGoing,
      },
    });
  }
}
