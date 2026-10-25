/**
 * Stackra file contract:
 * Purpose: `GraphOptions<M, F>`, what `GraphQuery.through(Model, relation, options)` takes: the source rows' filter,
 *          the fields read from the source (under its own key) and from the related model (under the relation's
 *          key), and the page size.
 * Boundary: a type only. The field lists are checked against each loaded row before they are returned.
 * Runtime: node
 * Governing contract: ADR 0104 (decision 2: the query graph); ADR 0268 (R10: graph limits).
 */
import type { Where } from "#contracts/types/where.type";

/** The graph read options. */
export interface GraphOptions<
  M extends object,
  F extends Readonly<Record<string, readonly string[]>>,
> {
  /** The source rows. */
  readonly where?: Where<M>;

  /** Two keys: the source's name with its fields, and the relation with the related model's fields. */
  readonly fields: F;

  /** How many source rows: 20 by default, 100 at most. */
  readonly limit?: number;
}
