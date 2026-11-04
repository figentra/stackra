/**
 * Stackra file contract:
 * Purpose: `cliIoOf(io)`, the `CliIo` a console command hands the runners it shares with the passthrough commands
 *          (`runGen`, `runCheck`, `runToolTask`, `runDbSeed`): their lines go out byte-exact on the run's standard
 *          output and error, and under `--json` the normal lines go to standard error, so standard output carries the
 *          `--json` document alone.
 * Boundary: writes nothing itself. `inherit` is false: a runner that starts a tool takes a `start` that runs it
 *           through `io.process` (`runInherited`), never `runProcess`.
 * Runtime: node
 * Governing contract: ADR 0506 (amendment 2026-11-03); STA-1966.
 */
import type { CommandIo } from "@stackra/console";

import type { CliIo } from "#node/types/cli-io.type";

/**
 * The runners' io for `io`.
 *
 * @example
 * const clean = await runGen(io.cwd, { base: io.cwd }, cliIoOf(io));
 */
export function cliIoOf(io: CommandIo): CliIo {
  // The streams, not io.output: these lines are what scripts and the gen phase already parse, so they stay byte-exact.
  return {
    out: (text) => (io.json ? io.stderr : io.stdout).write(text),
    err: (text) => io.stderr.write(text),
    inherit: false,
  };
}
