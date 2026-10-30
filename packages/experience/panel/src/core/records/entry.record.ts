/**
 * Stackra file contract:
 * Purpose: `EntryRecord`, one infolist entry under construction: the runtime side of `EntryBuilder`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1).
 */
import type { I18nKey } from "@stackra/i18n";

import { DraftRecord } from "#core/records/draft.record";
import type { EntryBuilder } from "#core/types/entry-builder.type";
import type { EntryNode } from "#core/types/entry-node.type";

/** The flags an entry records. */
interface EntryFlags {
  readonly copyable?: boolean;
  readonly labels?: Readonly<Record<string, I18nKey>>;
}

/** Records the flags of one entry before it builds. */
export class EntryRecord extends DraftRecord<EntryFlags, EntryNode> implements EntryBuilder {
  /**
   * @param build - the `Entry` constructor call for the recorded flags.
   */
  constructor(build: (flags: EntryFlags) => EntryNode) {
    super(build, {});
  }

  /** Adds a copy button. */
  copyable(): this {
    return this.set({ copyable: true });
  }

  /** Names the label key of each enum code. */
  labels(labels: Readonly<Record<string, I18nKey>>): this {
    return this.set({ labels });
  }
}
