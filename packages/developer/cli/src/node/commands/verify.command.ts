/**
 * Stackra file contract:
 * Purpose: `VerifyCommand`, `stackra verify`: `stackra check --with-tests`: every phase, the tests included. Its flags are `stackra check`'s; a flag on the command line wins over
 *          the preset. `--json`: `{ phases, findings }`, each phase (phase, status, findings, fixable, durationMs) and every
 *          finding, whatever `--format` says (`runCheck` reports them).
 * Boundary: the body is `checkCommand("verify")` over `runCheck`, unchanged; phases return findings and never print.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); the quality-gate coverage audit of 2026-10-27; ADR 0506; ADR 0500
 *                     (decision 7); STA-2883; STA-2924 (the shared `CheckOptionSet`).
 */
import { Command, Options, type CommandIo } from "@stackra/console";

import { checkCommand } from "#node/functions/check-command.function";
import { runCheckPreset } from "#node/functions/run-check-preset.function";
import { CheckOptionSet } from "#node/option-sets/check.option-set";
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

  /** The flags every check command shares. */
  @Options(CheckOptionSet)
  flags = new CheckOptionSet();

  /** Runs the phases; the exit code is 1 when one failed. */
  handle(io: CommandIo): Promise<number> {
    return runCheckPreset(io, BODY, this.flags);
  }
}
