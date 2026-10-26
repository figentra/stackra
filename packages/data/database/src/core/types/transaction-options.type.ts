/**
 * Stackra file contract:
 * Purpose: `TransactionOptions`, how `Database.transaction(work, options)` and `Repository.insert(data, options)` and `CrudService.update(where, data, options)` relate
 *          to a transaction already running.
 * Boundary: a type only. Without `requiresNew`, work inside a transaction runs in a savepoint of it.
 * Runtime: node
 * Governing contract: ADR 0136 (decision 2: one transaction per action).
 */

/** The transaction options. */
export interface TransactionOptions {
  /** Run in a transaction of its own that commits even if the caller's rolls back (an audit or dedup row). */
  readonly requiresNew?: boolean;
}
