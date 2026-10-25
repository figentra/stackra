/**
 * Stackra file contract:
 * Purpose: `SectionRecord`, one infolist section under construction: the runtime side of `SectionBuilder`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1).
 */
import { Section } from "#core/constants/section.constant";
import { DraftRecord } from "#core/records/draft.record";
import type { Built } from "#core/types/built.type";
import type { EntryNode } from "#core/types/entry-node.type";
import type { SectionBuilder } from "#core/types/section-builder.type";

/** The flags a section records. */
interface SectionFlags {
  readonly aside?: boolean;
}

/** One section. */
export class SectionRecord extends DraftRecord<SectionFlags, EntryNode> implements SectionBuilder {
  /**
   * @param name - the section name.
   * @param entries - the entry steps in it.
   */
  constructor(name: string, entries: readonly Built<EntryNode>[]) {
    super(
      (flags) =>
        Section.of(
          name,
          entries.map((entry) => entry.toNode()),
          flags,
        ),
      {},
    );
  }

  /** Moves the section to the side column. */
  aside(): this {
    return this.set({ aside: true });
  }
}
