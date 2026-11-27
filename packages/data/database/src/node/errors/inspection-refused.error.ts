/**
 * Stackra file contract:
 * Purpose: `InspectionRefusedError`, the refusal of a developer database inspection (`describeSchema`,
 *          `queryInScope`, `migrationStatus`): an environment other than local dev and the testbed, a dev connection
 *          to a host off this machine, a role that can bypass row-level security, or a query input out of bounds.
 * Boundary: a `UsageError` of `@stackra/console`, so the `stackra` command it surfaces through exits 2 and its `--json`
 *           document (and the MCP tool result) carries the code `inspection_refused` with the message and the hint. A
 *           message names a host, a role or an environment, never a connection string or a password.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: query the local database); `.agents/rules/tenancy.md` (two layers);
 *                     STA-2906.
 */
import { UsageError } from "@stackra/console";

/** A developer database inspection the caller must change. */
export class InspectionRefusedError extends UsageError {
  /**
   * @param message - what is refused, naming the environment, host, role or input.
   * @param hint - what to do instead.
   */
  constructor(message: string, hint?: string) {
    super(message, hint);
    this.name = "InspectionRefusedError";
  }
}
