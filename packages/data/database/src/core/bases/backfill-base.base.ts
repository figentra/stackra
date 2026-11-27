/**
 * Stackra file contract:
 * Purpose: `BackfillBase`, the instance base of the `Backfill` kind: `apply(batch)` fills one batch's rows when the
 *          declaration has no `set`.
 * Boundary: the default `apply` refuses, so a backfill states either `set` or its own `apply`. `apply` runs inside the
 *           batch's transaction and writes only through `batch.execute`.
 * Runtime: node
 * Governing contract: ADR 0159 (decision 3: backfills run as queue jobs); ADR 0294 (decision 25: kind bases).
 */
import type { BackfillBatch } from "#core/types/backfill-batch.type";

/** The base every backfill instance extends. */
export abstract class BackfillBase {
  /** Type-only kind brand, so a class of another kind cannot stand in for a backfill. */
  declare readonly "~kind": "backfill";

  /**
   * Fills the rows of `batch`, for a backfill without `set`.
   *
   * @throws TypeError unless a subclass overrides it.
   */
  apply(batch: BackfillBatch): Promise<void> {
    return Promise.reject(
      new TypeError(
        `${this.constructor.name} declares no set and no apply(batch): one of them fills the ${batch.keys.length} rows`,
      ),
    );
  }
}
