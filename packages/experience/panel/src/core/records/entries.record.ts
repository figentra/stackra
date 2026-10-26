/**
 * Stackra file contract:
 * Purpose: `EntriesRecord<R>`, what an infolist's entries callback receives: the runtime side of `EntryFactory<R>`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1).
 */
import { Entry } from "#core/constants/entry.constant";
import { EntryRecord } from "#core/records/entry.record";
import { SectionRecord } from "#core/records/section.record";
import type { Built } from "#core/types/built.type";
import type { ElementOf } from "#core/types/element-of.type";
import type { EntryFactory } from "#core/types/entry-factory.type";
import type { EntryNode } from "#core/types/entry-node.type";
import type { Path } from "#core/types/path.type";
import type { PathValue } from "#core/types/path-value.type";

/** Builds infolist entries over record type `R`. */
export class EntriesRecord<R> implements EntryFactory<R> {
  /** A value entry. */
  from(key: Path<R>): EntryRecord {
    return new EntryRecord((flags) => Entry.from(key, flags));
  }

  /** A principal entry. */
  principal(key: Path<R>): EntryRecord {
    return new EntryRecord((flags) => Entry.principal(key, flags));
  }

  /** A money entry. */
  money(key: Path<R>, options: { readonly currency: Path<R> }): EntryRecord {
    return new EntryRecord((flags) => Entry.money(key, { ...flags, currency: options.currency }));
  }

  /** A list entry. */
  list<K extends Path<R>>(
    key: K,
    columns: readonly Path<ElementOf<NonNullable<PathValue<R, K>>>>[],
  ): Built<EntryNode> {
    return { toNode: () => Entry.list(key, { columns }) };
  }

  /** Groups entries into a named section. */
  section(name: string, entries: readonly Built<EntryNode>[]): SectionRecord {
    return new SectionRecord(name, entries);
  }
}
