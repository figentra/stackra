/**
 * Stackra file contract:
 * Purpose: `UpdateOptions`, what `CrudService.update(where, data, options)` takes: the transaction options plus the
 *          version the caller last read (`expectedVersion`, an action's `ctx.expectedVersion` from If-Match).
 * Boundary: a type only. `expectedVersion` applies to a `Versioned` model; a row at another version is refused with
 *           `StaleVersionError` (409) before anything is written.
 * Runtime: node
 * Governing contract: ADR 0133 (decision 6: optimistic concurrency); ADR 0305 (rules 10 to 13).
 */
import type { TransactionOptions } from "#core/types/transaction-options.type";

/** The update options. */
export interface UpdateOptions extends TransactionOptions {
  /** The `version` the caller read the row at; the update is refused when the row has moved on. */
  readonly expectedVersion?: number;
}
