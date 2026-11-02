/**
 * Stackra file contract:
 * Purpose: `ConsoleRunOptions`, how `io.process.run` runs and checks one child: the runner's options, whether a
 *          non-zero exit throws, and the fix command carried into that error.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-007 and FR-028.
 */
import type { ProcessRunOptions } from "#contracts/types/process-run-options.type";

/** How one child process is run and checked. */
export interface ConsoleRunOptions extends ProcessRunOptions {
  /** Throw on a non-zero exit; true by default. */
  readonly check?: boolean;

  /** The exact command that fixes a failure, carried into the error. */
  readonly fix?: string;
}
