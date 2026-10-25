/**
 * Stackra file contract:
 * Purpose: `FieldBuilder`, one field under construction: the grid columns it spans.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11).
 */
import type { Built } from "#core/types/built.type";
import type { FieldNode } from "#core/types/field-node.type";

/** One field. */
export interface FieldBuilder extends Built<FieldNode> {
  /** The grid columns the field spans. */
  span(columns: number): this;
}
