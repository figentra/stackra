/**
 * Stackra file contract:
 * Purpose: `CodeFixCommand`, `stackra code:fix`: `stackra check --only format,lint --fix`. Its flags are `stackra check`'s; a flag on the command line wins over
 *          the preset. `--json`: the phases (status, findings, fixable, duration) and every finding.
 * Boundary: the body is `checkCommand("code:fix")` over `runCheck`, unchanged; phases return findings and never print.
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
  "code:fix",
  "Format and apply lint fixes (`stackra check --only format,lint --fix`)",
  { only: ["format", "lint"], fix: true },
);

/** Formats and applies lint fixes. */
export class CodeFixCommand extends Command({
  name: "code:fix",
  description: BODY.summary,
  group: "Quality",
  hidden: true,
  bin: true,
  examples: ["stackra code:fix"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = BODY;

  /** Apply the fixes the tools can make. */
  @Option({
    description:
      "Apply the fixes the tools can make (format, lint), then report what is left (code:fix always does)",
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

  /** Run the tests too. */
  @Option({ description: "Run the test phase too" })
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
