/**
 * Stackra file contract:
 * Purpose: `RunwayCommand`, `stackra runway <command>`: every Runway command (plan, deploy, promote, rollback, status,
 *          validate, drift, secrets, env) through the framework's one public command, as ADR 0529 decision 4 amended
 *          decides. It runs @stackra/runway's `RUNWAY_COMMANDS` on their own console with the run's raw tokens, so
 *          their options, exit codes and `--json` envelopes are the `runway` binary's, byte for byte.
 * Boundary: a passthrough; it parses nothing itself and writes only through the run's streams. The `runway` binary
 *           stays as an alias for one minor release (STA-2214), then goes.
 * Runtime: node
 * Governing contract: ADR 0529 (decision 4, amended 2026-11-06); ADR 0506 (decision 8); ADR 0500 (decision 1).
 */
import { Command, createConsole, type CommandIo } from "@stackra/console";
import { nodePorts } from "@stackra/console/node";
import { RUNWAY_COMMANDS } from "@stackra/runway/node";

import { cliVersion } from "#node/functions/cli-version.function";

/** `stackra runway <command>`: Runway's commands under the framework command. */
export class RunwayCommand extends Command({
  name: "runway",
  description:
    "Runway's commands: plan, deploy, promote, rollback, status, validate, drift, secrets, env (`stackra runway help [command]`)",
  examples: [
    "stackra runway help",
    "stackra runway help deploy",
    "stackra runway plan --env staging",
    "stackra runway status --json",
  ],
  passthrough: true,
}) {
  /** Runs the Runway command line in the raw tokens; the exit code is that command's own. */
  async handle(io: CommandIo): Promise<number> {
    // A passthrough gets its tokens as typed (`--json` included); only `--help` stays with the outer console, so
    // Runway's own help is `stackra runway help [command]`.
    return createConsole({
      name: "stackra runway",
      version: cliVersion(),
      commands: RUNWAY_COMMANDS,
      requireCommand: true,
    }).run(io.rest, {
      ...nodePorts(),
      cwd: io.cwd,
      stdout: io.stdout,
      stderr: io.stderr,
      stdoutIsTTY: io.animate,
      stdinIsTTY: io.interactive,
    });
  }
}
