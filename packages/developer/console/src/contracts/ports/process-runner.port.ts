/**
 * Stackra file contract:
 * Purpose: the `ProcessRunner` port: runs one child process with its output captured, or with the terminal when it is
 *          interactive, and resolves with its exit code and output.
 * Boundary: an abstract class that is its own token. A driver never prints the child's output itself: the console
 *           shows it only under `--verbose`, and the tail of a failed step under its task line. The node driver lives
 *           in `./node`, a memory one in `./testing`.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-001, FR-007 and FR-028.
 */
import { Port } from "@stackra/contracts";

import type { ProcessResult } from "#contracts/types/process-result.type";
import type { ProcessRunOptions } from "#contracts/types/process-run-options.type";

/**
 * Runs child processes.
 *
 * @example
 * export class NodeProcessRunnerDriver extends Driver(ProcessRunner) {
 *   run(command: string, args: readonly string[], options: ProcessRunOptions): Promise<ProcessResult> {
 *     return spawnCaptured(command, args, options);
 *   }
 * }
 */
export abstract class ProcessRunner extends Port {
  /** Runs `command` with `args`; resolves when it exits, whatever its code. */
  abstract run(
    command: string,
    args: readonly string[],
    options: ProcessRunOptions & { readonly cwd: string },
  ): Promise<ProcessResult>;
}
