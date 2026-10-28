/**
 * Stackra file contract:
 * Purpose: `TransactionOptions`, how `Database.transaction(work, options)` and `Repository.insert(data, options)` and
 *          `CrudService.update(where, data, options)` relate to a transaction already running, and the statement
 *          timeout of the work (an action's `timeout`).
 * Boundary: a type only. Without `requiresNew`, work inside a transaction runs in a savepoint of it. A `timeout` is
 *           `set local statement_timeout`, so it holds until the outermost transaction ends.
 * Runtime: node
 * Governing contract: ADR 0136 (decision 2: one transaction per action).
 */

import type { Duration } from "@stackra/contracts";

/** The transaction options. */
export interface TransactionOptions {
  /** Run in a transaction of its own that commits even if the caller's rolls back (an audit or dedup row). */
  readonly requiresNew?: boolean;

  /** The statement timeout inside the transaction, replacing the session's (`DatabaseConfig.timeouts.statement`). */
  readonly timeout?: Duration;
}
