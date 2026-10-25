/**
 * Stackra file contract:
 * Purpose: `EntryBuilder`, one infolist entry under construction: whether it is copyable.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1).
 */
import type { Built } from "#core/types/built.type";
import type { EntryNode } from "#core/types/entry-node.type";

/** One entry. */
export interface EntryBuilder extends Built<EntryNode> {
  /** Adds a copy button to the value. */
  copyable(): this;
}
