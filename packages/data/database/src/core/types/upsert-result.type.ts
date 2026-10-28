/**
 * Stackra file contract:
 * Purpose: `UpsertResult<M>`, what `Repository.upsert` returns: the written rows in the input's order, and how many of
 *          them were created and how many matched an existing row and were updated.
 * Boundary: a type only; `created + updated` is the input's length.
 * Runtime: node
 * Governing contract: data-layer gap mo9 (stackra-280); ADR 0367 (an import's created and updated counts).
 */

/** The outcome of one upsert. */
export interface UpsertResult<M> {
  /** The written rows, one per input row, in the input's order. */
  readonly rows: readonly M[];

  /** How many rows were new. */
  readonly created: number;

  /** How many rows matched an existing row by `by` and were changed. */
  readonly updated: number;
}
