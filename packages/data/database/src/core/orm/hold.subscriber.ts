/**
 * Stackra file contract:
 * Purpose: `HoldSubscriber`, the ORM subscriber that consults the connected `HoldRegistry` before a unit-of-work delete
 *          and refuses the flush when a row it would remove is under a legal hold, so `em.remove` of a held record
 *          writes nothing.
 * Boundary: passed as one of `DatabaseOptions.subscribers`; registering it in the generated boot is gen's (STA-339).
 *           It takes no arguments: the registry is the one `connectHoldRegistry` names, and with none connected it
 *           does nothing. Bulk deletes (`purge`, `nativeDelete`) fire no entity event; `CrudService.purge` consults the
 *           registry itself. A soft delete is an update and is not a disposal.
 * Runtime: node
 * Governing contract: ADR 0134 (2026-10-24 amendment: every delete path consults the registry); ADR 0096 (decision 4:
 *                     traits run as ORM subscribers).
 */
import type { EventArgs, EventSubscriber } from "@mikro-orm/core";

import { disposableIds } from "#core/functions/disposable-ids.function";
import { RecordHeldError } from "#core/errors/record-held.error";
import { Disposal } from "#contracts/enums/disposal.enum";

/**
 * Refuses the delete of a held record.
 *
 * @example
 * const database = await PostgresDatabaseDriver.connect({ url, subscribers: [new HoldSubscriber()] });
 */
export class HoldSubscriber implements EventSubscriber<object> {
  /**
   * The ORM's `beforeDelete`.
   *
   * @throws RecordHeldError when the row is under a legal hold.
   */
  async beforeDelete(args: EventArgs<object>): Promise<void> {
    const [key = "id"] = args.meta.primaryKeys;
    const id = String((args.entity as Record<string, unknown>)[key]);
    const [free] = await disposableIds(args.meta.class, [id], Disposal.Delete);
    if (free === undefined) throw RecordHeldError.create({ model: args.meta.className, id });
  }
}
