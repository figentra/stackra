/**
 * Stackra file contract:
 * Purpose: `ChangedRow`, the part of an outbox `RowChange` that `CacheInvalidationService` reads: which model and which
 *          row.
 * Boundary: a type only, structurally a subset of @stackra/outbox's `RowChange`, so the service is a `ChangeConsumer`
 *           without this package importing @stackra/outbox (which depends on this package).
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 5); ADR 0078 (decision 4); data-layer gaps ca4 and cdc10.
 */

/** A changed row, named by model and id. */
export interface ChangedRow {
  /** The model's class name (`Product`). */
  readonly model: string;

  /** The row's primary key, serialised (`prd_…`). */
  readonly id: string;
}
