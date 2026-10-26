/**
 * Stackra file contract:
 * Purpose: `ListingRecord`, a list or view display under construction: the runtime side of `ListingBuilder`.
 * Boundary: internal: the runtime side of the public builder type; no entry exports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 14).
 */
import { DraftRecord } from "#core/records/draft.record";
import type { DisplayNode } from "#core/types/display-node.type";
import type { ListingBuilder } from "#core/types/listing-builder.type";

/** The flags a listing records. */
interface ListingFlags {
  readonly limit?: number;
}

/** A list or view display. */
export class ListingRecord
  extends DraftRecord<ListingFlags, DisplayNode>
  implements ListingBuilder
{
  /**
   * @param build - the `WidgetDisplay` constructor call for the recorded flags.
   */
  constructor(build: (flags: ListingFlags) => DisplayNode) {
    super(build, {});
  }

  /**
   * Shows at most `rows` rows.
   *
   * @throws RangeError when `rows` is not a whole number from 1 to 100.
   */
  limit(rows: number): this {
    if (!Number.isInteger(rows) || rows < 1 || rows > 100)
      throw new RangeError(`limit(rows) is a whole number from 1 to 100, got ${rows}`);
    return this.set({ limit: rows });
  }
}
