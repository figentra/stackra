/**
 * Stackra file contract:
 * Purpose: `runCheckPreset(io, body, flags)`, runs a check body (`stackra check` or a preset) with the shared check
 *          flags, through `runBody`.
 * Boundary: no logic of its own: `checkValues` names the flags, `runBody` runs the body.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 7); STA-2883; STA-2924.
 */
import type { CommandIo } from "@stackra/console";

import { checkValues } from "#node/functions/check-values.function";
import { runBody } from "#node/functions/run-body.function";
import type { CheckOptionSet } from "#node/option-sets/check.option-set";
import type { CliCommand } from "#node/types/cli-command.type";

/**
 * The exit code of `body` run with `flags`.
 *
 * @example
 * return runCheckPreset(io, BODY, this.flags);
 */
export function runCheckPreset(
  io: CommandIo,
  body: CliCommand,
  flags: CheckOptionSet,
): Promise<number> {
  return runBody(io, body, { values: checkValues(flags) });
}
