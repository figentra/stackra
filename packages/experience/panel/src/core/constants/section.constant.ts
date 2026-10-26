/**
 * Stackra file contract:
 * Purpose: `Section`, the data constructor of an infolist section (`Section.of("totals", [...], { aside: true })`).
 * Boundary: pure: returns a frozen section `EntryNode`; the infolist builder records through it. Its label is derived.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 and 6).
 */
import type { EntryNode } from "#core/types/entry-node.type";

/**
 * Builds the section nodes that group entries on a View page.
 *
 * @example
 * Section.of("summary", [Entry.from("title"), Entry.from("slug", { copyable: true })]);
 */
export const Section = Object.freeze({
  /** The titled group `name` of `entries`. */
  of: (
    name: string,
    entries: readonly EntryNode[],
    options: { readonly aside?: boolean } = {},
  ): EntryNode =>
    Object.freeze({ kind: "section", name, entries: Object.freeze([...entries]), ...options }),
});
