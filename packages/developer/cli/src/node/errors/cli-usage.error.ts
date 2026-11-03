/**
 * Stackra file contract:
 * Purpose: `CliUsageError`, a command line that cannot run as written (an unknown target or tier, a missing
 *          argument): `runCli` prints its message and the command's usage and exits with 2. It is the console's
 *          `UsageError`, so a native command class that calls a function throwing it exits 2 as well.
 * Boundary: a failed tool or gen run is an exit code, not this error.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0506; STA-1966; POSIX exit status 2 for a usage error.
 */
import { UsageError } from "@stackra/console";

/**
 * A command line that cannot run as written.
 *
 * @example
 * throw new CliUsageError("unknown tier: load (expected unit or e2e)");
 */
export class CliUsageError extends UsageError {
  /**
   * @param message - what is wrong with the command line.
   */
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}
