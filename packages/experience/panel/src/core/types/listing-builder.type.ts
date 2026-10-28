/**
 * Stackra file contract:
 * Purpose: `ListingBuilder`, a list or view display under construction: the most rows it shows.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 14).
 */
import type { Built } from "#core/types/built.type";
import type { DisplayNode } from "#core/types/display-node.type";

/** A list or view display. */
export interface ListingBuilder extends Built<DisplayNode> {
  /** Shows at most `rows` rows, then "Open all". */
  limit: (rows: number) => this;
}
