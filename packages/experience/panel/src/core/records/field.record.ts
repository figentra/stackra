/**
 * Stackra file contract:
 * Purpose: `FieldRecord`, one form field under construction: the runtime side of `FieldBuilder`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 11).
 */
import { DraftRecord } from "#core/records/draft.record";
import type { FieldBuilder } from "#core/types/field-builder.type";
import type { FieldNode } from "#core/types/field-node.type";

/** The flags a field records. */
interface FieldFlags {
  readonly span?: number;
  readonly essential?: boolean;
}

/** One form field. */
export class FieldRecord extends DraftRecord<FieldFlags, FieldNode> implements FieldBuilder {
  /**
   * @param build - the `FormField` constructor call for the recorded flags.
   */
  constructor(build: (flags: FieldFlags) => FieldNode) {
    super(build, {});
  }

  /**
   * The grid columns the field spans.
   *
   * @throws RangeError when `columns` is not a whole number from 1 to 12.
   */
  span(columns: number): this {
    if (!Number.isInteger(columns) || columns < 1 || columns > 12)
      throw new RangeError(`span(columns) is a whole number from 1 to 12, got ${columns}`);
    return this.set({ span: columns });
  }

  /** Marks the field as one normal mode shows. */
  essential(): this {
    return this.set({ essential: true });
  }
}
