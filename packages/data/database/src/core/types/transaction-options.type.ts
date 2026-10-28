/**
 * Stackra file contract:
 * Purpose: `TransactionOptions`, how `Database.transaction(work, options)` and `Repository.insert(data, options)` and
 *          `CrudService.update(where, data, options)` relate to a transaction already running, and how the work runs:
 *          its statement and lock timeouts (an action's `timeout`), and, for a transaction the call starts, its
 *          isolation level, a read-only flag and how many times a serialization failure or deadlock runs it again.
 * Boundary: a type only. Without `requiresNew`, work inside a transaction runs in a savepoint of it. A `timeout` or a
 *           `lockTimeout` is `set local`, so it holds until the outermost transaction ends. `isolation`, `readOnly`
 *           and `retry` belong to a transaction's start, so they are refused (a `TypeError`) inside a running one
 *           unless `requiresNew` starts another. `insert` and `update` read only `requiresNew`.
 * Runtime: node
 * Governing contract: ADR 0136 (decision 2: one transaction per action); data-layer gap mo6 (P1 part, stackra-279).
 */
import type { Duration } from "@stackra/contracts";

import type { Isolation } from "#core/enums/isolation.enum";

/** The transaction options. */
export interface TransactionOptions {
  /** Run in a transaction of its own that commits even if the caller's rolls back (an audit or dedup row). */
  readonly requiresNew?: boolean;

  /** The statement timeout inside the transaction, replacing the session's (`DatabaseConfig.timeouts.statement`). */
  readonly timeout?: Duration;

  /** How long a statement waits for a row or table lock before it fails with `55P03` (`set local lock_timeout`). */
  readonly lockTimeout?: Duration;

  /** The isolation level of the transaction this call starts; the session's (`read committed`) when absent. */
  readonly isolation?: Isolation;

  /** Start the transaction read-only: a write inside it fails (`25006`), and Postgres may skip some locking. */
  readonly readOnly?: boolean;

  /**
   * How many more times the whole work runs when the transaction fails with a serialization failure (`40001`) or a
   * deadlock (`40P01`), after a jittered back-off; 0 (the default) to 10. The work must be safe to run again: an
   * external call belongs in `afterCommit`.
   */
  readonly retry?: number;
}
