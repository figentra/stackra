/**
 * Stackra file contract:
 * Purpose: `Infolist<R>`, the builder a resource's `infolist(i)` member receives: the View page's entries and sections,
 *          every key a path of the record `R`.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: infolist keys come from the get output).
 */
import type { Built } from "#core/types/built.type";
import type { EntryFactory } from "#core/types/entry-factory.type";
import type { EntryNode } from "#core/types/entry-node.type";
import type { InfolistNode } from "#core/types/infolist-node.type";

/**
 * A View page's infolist over record type `R`.
 *
 * @example
 * override infolist(i: Infolist<OrderView>) {
 *   return i.entries((e) => [e.section("summary", [e.from("id").copyable(), e.from("status")])]);
 * }
 */
export interface Infolist<R> extends Built<InfolistNode> {
  /** Sets the entries and sections, in order. */
  entries: (build: (entry: EntryFactory<R>) => readonly Built<EntryNode>[]) => this;
}
