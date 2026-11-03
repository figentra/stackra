/**
 * Stackra file contract:
 * Purpose: `ConsoleProcess`, how a command runs a child process (`io.process`): in the run's working directory, its
 *          output captured and shown only under `--verbose`, a non-zero exit thrown as a `CommandError` whose detail
 *          is the output (the task line shows its tail), and an interactive child refused without a terminal. An
 *          `inherit` child shares the streams (stderr only under `--json`) and is refused while the run holds a
 *          secret value.
 * Boundary: a type only; `createProcess` implements it over the run's `ProcessRunner`.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-007, FR-028 and FR-029.
 */
import type { ProcessResult } from "#contracts/types/process-result.type";
import type { ConsoleRunOptions } from "#core/types/console-run-options.type";

/** Runs child processes for a command. */
export interface ConsoleProcess {
  /**
   * Runs `command` with `args` and resolves with its result.
   *
   * @throws CommandError when it exits non-zero (unless `check: false`), when it is interactive and the run is not,
   *         or when it inherits the streams and the run holds a secret value.
   */
  readonly run: (
    command: string,
    args: readonly string[],
    options?: ConsoleRunOptions,
  ) => Promise<ProcessResult>;
}
