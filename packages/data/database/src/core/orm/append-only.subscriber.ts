/**
 * Stackra file contract:
 * Purpose: `AppendOnlySubscriber`, the ORM subscriber that refuses the flush of a changed row of an `AppendOnly`
 *          model, so `em.assign` or a field set on a loaded ledger entry writes nothing.
 * Boundary: passed as one of `DatabaseOptions.subscribers` (the generated boot adds it). Inserts pass; a removal is
 *           not an update and passes too (retention and erasure remove rows). Native updates fire no entity event;
 *           `CrudService` refuses those itself, and the table's migration revokes `UPDATE` (`t.appendOnly()`).
 * Runtime: node
 * Governing contract: ADR 0134 (data invariants); ADR 0220 (the ledger is append-only); ADR 0096 (decision 4: traits
 *                     run as ORM subscribers).
 */
import type { EventArgs, EventSubscriber } from "@mikro-orm/core";

import { AppendOnlyWriteError } from "#core/errors/append-only-write.error";
import { isAppendOnly } from "#core/functions/is-append-only.function";

/**
 * Refuses an update of an append-only row.
 *
 * @example
 * const database = await PostgresDatabaseDriver.connect({ url, subscribers: [new AppendOnlySubscriber()] });
 */
export class AppendOnlySubscriber implements EventSubscriber<object> {
  /**
   * The ORM's `beforeUpdate`.
   *
   * @throws AppendOnlyWriteError when the row's model is `AppendOnly`.
   */
  beforeUpdate(args: EventArgs<object>): void {
    if (isAppendOnly(args.meta.class))
      throw AppendOnlyWriteError.create({ model: args.meta.className, operation: "update" });
  }
}
