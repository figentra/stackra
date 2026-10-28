/**
 * Stackra file contract:
 * Purpose: `RowChange`, one change of a watched model's row as its change consumers receive it: which model, which
 *          row, how it changed, which fields the write set and, for a model whose `CapturesChanges` asks for values,
 *          those fields' values before and after.
 * Boundary: a type only, JSON as stored in the change log. Values are opt-in per model and never carry an encrypted or
 *           `@Classified` field (`changeCaptureOf` drops them), nor any value for a native write (no entity to read). A
 *           consumer that needs the whole row reads it, in the scope the relay opens for it, so row-level security
 *           still applies.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 5: indexing through the outbox); ADR 0078 (decision 4); ADR 0078 and ADR 0221
 *                     (2026-10-28 amendment: the retained change feed with opt-in values).
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

  /** The written fields' values before the write (every kept field of a deleted row), when the model captures values. */
  readonly before?: Readonly<Record<string, unknown>>;

  /** The written fields' values after the write, when the model captures values; absent for a delete. */
  readonly after?: Readonly<Record<string, unknown>>;
}
