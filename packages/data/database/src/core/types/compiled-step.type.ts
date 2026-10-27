/**
 * Stackra file contract:
 * Purpose: `CompiledStep`, one SQL step of a compiled migration: its statements, whether the runner wraps them in a
 *          transaction, and the statements that undo it on a dev database.
 * Boundary: data. A concurrent index build is always its own non-transactional, single-statement step. The runner
 *           (`stackra db migrate`) sets the lock and statement timeouts per session; the inverse runs only through
 *           `stackra db rollback` on dev, preview and test databases.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3; 2026-10-23 and 2026-10-24 notes).
 */

/** One SQL step of a compiled migration. */
export interface CompiledStep {
  /** The statements, in order. */
  readonly sql: readonly string[];

  /** Whether the runner wraps the statements in one transaction. */
  readonly transactional: boolean;

  /** The statements that undo the step, in order, or `false` when a raw statement declared it irreversible. */
  readonly inverse: readonly string[] | false;
}
