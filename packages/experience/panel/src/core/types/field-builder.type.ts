/**
 * Stackra file contract:
 * Purpose: `FieldBuilder`, one field under construction: the grid columns it spans and whether normal mode shows it.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11); ADR 0359 (decision 1).
 */
import type { Built } from "#core/types/built.type";
import type { FieldNode } from "#core/types/field-node.type";

/** One field. */
export interface FieldBuilder extends Built<FieldNode> {
  /** The grid columns the field spans. */
  span(columns: number): this;

  /** Marks the field as one normal mode shows; developer mode shows every field. */
  essential(): this;
}
