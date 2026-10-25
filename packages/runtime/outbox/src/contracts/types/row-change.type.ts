/**
 * Stackra file contract:
 * Purpose: `RowChange`, one change of a watched model's row as its change consumers receive it: which model, which
 *          row, how it changed and which fields the flush wrote.
 * Boundary: a type only, JSON as stored in an outbox message. It names the row, never its values: a consumer that needs
 *           them reads the row, in the scope the relay opens for it, so row-level security still applies.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 5: indexing through the outbox); ADR 0078 (decision 4).
 */
import type { RowChangeKind } from "#contracts/enums/row-change-kind.enum";

/** A change of one row. */
export interface RowChange {
  /** The model's class name (`Product`), as `registerChangeConsumers` registered it. */
  readonly model: string;

  /** The row's primary key, serialised (`prd_…`). */
  readonly id: string;

  /** How the row changed. */
  readonly kind: RowChangeKind;

  /** The fields the flush wrote: every set field of a created row, the changed ones of an update, none for a delete. */
  readonly fields: readonly string[];
}
