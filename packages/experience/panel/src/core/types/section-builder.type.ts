/**
 * Stackra file contract:
 * Purpose: `SectionBuilder`, one infolist section under construction: whether it sits in the side column.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1).
 */
import type { Built } from "#core/types/built.type";
import type { EntryNode } from "#core/types/entry-node.type";

/** The chainable builder of one View page section. */
export interface SectionBuilder extends Built<EntryNode> {
  /** Moves the section to the side column. */
  aside(): this;
}
