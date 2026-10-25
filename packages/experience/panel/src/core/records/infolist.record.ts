/**
 * Stackra file contract:
 * Purpose: `InfolistRecord<R>`, the builder a resource's `infolist(i)` member receives: the runtime side of `Infolist<R>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1).
 */
import { EntriesRecord } from "#core/records/entries.record";
import type { Built } from "#core/types/built.type";
import type { EntryFactory } from "#core/types/entry-factory.type";
import type { EntryNode } from "#core/types/entry-node.type";
import type { Infolist } from "#core/types/infolist.type";
import type { InfolistNode } from "#core/types/infolist-node.type";

/** A View page's infolist over record type `R`. */
export class InfolistRecord<R> implements Infolist<R> {
  /** The entry steps. */
  private steps: readonly Built<EntryNode>[] = [];

  /** Sets the entries. */
  entries(build: (entry: EntryFactory<R>) => readonly Built<EntryNode>[]): this {
    this.steps = build(new EntriesRecord<R>());
    return this;
  }

  /** The recorded infolist. */
  toNode(): InfolistNode {
    return Object.freeze({ entries: Object.freeze(this.steps.map((step) => step.toNode())) });
  }
}
