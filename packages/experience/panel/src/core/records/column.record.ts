/**
 * Stackra file contract:
 * Purpose: `ColumnRecord`, one column under construction: the runtime side of `ColumnBuilder`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 1 and 2).
 */
import { DraftRecord } from "#core/records/draft.record";
import type { ColumnBuilder } from "#core/types/column-builder.type";
import type { ColumnNode } from "#core/types/column-node.type";

/** The flags a column records. */
interface ColumnFlags {
  readonly copyable?: boolean;
  readonly sortable?: boolean;
  readonly hidden?: boolean;
}

/** One column. */
export class ColumnRecord extends DraftRecord<ColumnFlags, ColumnNode> implements ColumnBuilder {
  /** @param build - the `Column` constructor call for the recorded flags. */
  constructor(build: (flags: ColumnFlags) => ColumnNode) {
    super(build, {});
  }

  /** Adds a copy button to the cell. */
  copyable(): this {
    return this.set({ copyable: true });
  }

  /** Makes the column sortable. */
  sortable(): this {
    return this.set({ sortable: true });
  }

  /** Starts the column hidden. */
  hidden(): this {
    return this.set({ hidden: true });
  }
}
