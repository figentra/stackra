/**
 * Stackra file contract:
 * Purpose: `ValidateCommand`, `stackra validate`: the repository's shape (the config, structure, docs, catalogues and spec phases of `stackra check`), or with `--repository` the repo gate (config, layout, catalogues, structure and the repository findings). Its flags are `stackra check`'s; a flag on the command line wins over
 *          the preset. `--json`: `{ phases, findings }`, each phase (phase, status, findings, fixable, durationMs) and every
 *          finding, whatever `--format` says (`runCheck` reports them).
 *          With `--repository`, `--json` is `{ findings: [{ dir, text }] }`.
 * Boundary: the body is `VALIDATE_COMMAND`, unchanged; it writes findings and never changes a file (except `--fix` phases).
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); the quality-gate coverage audit of 2026-10-27; ADR 0506; ADR 0500
 *                     (decision 7); STA-2883; STA-2924 (the shared `CheckOptionSet`).
 */
import { Command, Option, Options, type CommandIo } from "@stackra/console";

import { VALIDATE_COMMAND } from "#node/constants/validate-command.constant";
import { checkValues } from "#node/functions/check-values.function";
import { runBody } from "#node/functions/run-body.function";
import { CheckOptionSet } from "#node/option-sets/check.option-set";
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

  /** The flags every check command shares. */
  @Options(CheckOptionSet)
  flags = new CheckOptionSet();

  /** The repo gate. */
  @Option({
    description:
      "Run the repo gate instead: config, layout, catalogues, structure and the repository checks",
  })
  repository = false;

  /** Runs the checks; the exit code is 1 on a finding. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, VALIDATE_COMMAND, {
      values: { ...checkValues(this.flags), repository: this.repository },
    });
  }
}
