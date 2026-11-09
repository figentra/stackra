/**
 * Stackra file contract:
 * Purpose: `CliUsageError`, a command line that cannot run as written (an unknown target or tier, a missing
 *          argument): a passthrough command prints its message and usage, and a native console command renders it as
 *          the console's `UsageError` it is; both exit with 2.
 *          It keeps the name `UsageError`, so its `--json` error code is `usage`.
 * Boundary: a console `UsageError`; a failed tool or gen run is an exit code, not this error.
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
export class CliUsageError extends UsageError {}
