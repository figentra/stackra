/**
 * Stackra file contract:
 * Purpose: `UpsertOptions`, what `Repository.upsert(rows, options)` takes: the fields that identify a row (`by`, the
 *          columns of a unique index such as `["sku"]` or `["scopeId", "code"]`), and whether the write runs in a
 *          transaction of its own.
 * Boundary: a type only. `by` names scalar fields (a string, number, boolean or date column, or a link's id); every row
 *           must carry a non-null value for each, and two rows may not share one key.
 * Runtime: node
 * Governing contract: data-layer gap mo9 (stackra-280); ADR 0367 (`ImportTarget.upsert`).
 */
import type { TransactionOptions } from "#core/types/transaction-options.type";

/** The upsert options. */
export interface UpsertOptions extends Pick<TransactionOptions, "requiresNew"> {
  /** The fields a row is matched by, at least one; a unique index should cover them. */
  readonly by: readonly string[];
}
