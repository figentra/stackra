/**
 * Stackra file contract:
 * Purpose: `ExclusionOptions`, the options of `t.exclude(name, elements, options)`: the index method the constraint
 *          builds and a partial predicate.
 * Boundary: a type only; the blueprint checks each value. Literal SQL (the frozen snapshot rule).
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305; ADR 0160 note of 2026-11-03 (btree_gist for equality in a GiST
 *                     exclusion).
 */

/** How an exclusion constraint is built. */
export interface ExclusionOptions {
  /** The index method: `gist` (the default, with `Extension.BtreeGist` for `=` on a scalar column) or `btree`. */
  readonly using?: "gist" | "btree";

  /** A partial predicate: only rows meeting it are compared (`"cancelled_at is null"`). */
  readonly where?: string;
}
