/**
 * Stackra file contract:
 * Purpose: `FilterRecord`, one filter under construction: the runtime side of `FilterBuilder`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2).
 */
import { DraftRecord } from "#core/records/draft.record";
import type { FilterBuilder } from "#core/types/filter-builder.type";
import type { FilterNode } from "#core/types/filter-node.type";

/** The flags a filter records. */
interface FilterFlags {
  readonly default?: unknown;
  readonly pinned?: boolean;
}

/** Records the flags of one filter before it builds. */
export class FilterRecord extends DraftRecord<FilterFlags, FilterNode> implements FilterBuilder {
  /**
   * @param build - the `Filter` constructor call for the recorded flags.
   */
  constructor(build: (flags: FilterFlags) => FilterNode) {
    super(build, {});
  }

  /** The value the filter starts with. */
  default(value: unknown): this {
    return this.set({ default: value });
  }

  /** Pins the filter beside search. */
  pinned(): this {
    return this.set({ pinned: true });
  }
}
