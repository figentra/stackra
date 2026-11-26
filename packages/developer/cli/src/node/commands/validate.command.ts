/**
 * Stackra file contract:
 * Purpose: `ValidateCommand`, `stackra validate`: the repository's shape (the config, structure, docs, catalogues and spec phases of `stackra check`), or with `--repository` the repo gate (config, layout, catalogues, structure and the repository findings). Its flags are `stackra check`'s; a flag on the command line wins over
 *          the preset. `--json`: the phases (status, findings, fixable, duration) and every finding.
 * Boundary: the body is `VALIDATE_COMMAND`, unchanged; it writes findings and never changes a file (except `--fix` phases).
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); the quality-gate coverage audit of 2026-10-27; ADR 0506; ADR 0500
 *                     (decision 7); STA-2883.
 */
import { Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { VALIDATE_COMMAND } from "#node/constants/validate-command.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Checks the repository's shape. */
export class ValidateCommand extends Command({
  name: "validate",
  description: VALIDATE_COMMAND.summary,
  group: "Quality",
  hidden: true,
  bin: true,
  examples: ["stackra validate", "stackra validate --repository"],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = VALIDATE_COMMAND;

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

  /** Run the tests too. */
  @Option({ description: "Run the test phase too" })
  withTests = false;

  /** Keep going after a failed phase. */
  @Option({ description: "Run every phase even after one fails" })
  keepGoing = false;

  /** The repo gate. */
  @Option({
    description:
      "Run the repo gate instead: config, layout, catalogues, structure and the repository checks",
  })
  repository = false;

  /** Runs the checks; the exit code is 1 on a finding. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, VALIDATE_COMMAND, {
      values: {
        fix: this.fix,
        affected: this.affected,
        only: this.only,
        skip: this.skip,
        format: this.format,
        base: this.base,
        "with-tests": this.withTests,
        "keep-going": this.keepGoing,
        repository: this.repository,
      },
    });
  }
}
