/**
 * Stackra file contract:
 * Purpose: `InfolistNode`, a recorded View page infolist: its entries and sections in order.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1).
 */
import type { EntryNode } from "#core/types/entry-node.type";

/** A View page's infolist. */
export interface InfolistNode {
  /** The entries and sections in order. */
  readonly entries: readonly EntryNode[];
}
