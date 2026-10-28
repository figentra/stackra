/**
 * Stackra file contract:
 * Purpose: `StampSubscriber`, the ORM subscriber that fills the `Timestamps` and `UserStamps` fields of every
 *          unit-of-work write: `createdBy`/`updatedBy` from the running call's actor on a create (when still unset),
 *          `updatedAt` and `updatedBy` on an update.
 * Boundary: passed as one of `DatabaseOptions.subscribers`; registering it in the generated boot is gen's (STA-339).
 *           It takes no arguments: the actor comes through `stampFields` from the resolver `connectVisibilityFilter`
 *           named. A model without either trait is untouched. Native updates fire no entity event; `CrudService`
 *           stamps those itself. Input never sets a stamp: an action's input schema carries none of these fields.
 * Runtime: node
 * Governing contract: ADR 0133 (decision 7: user stamps); ADR 0096 (decision 4: traits run as ORM subscribers).
 */
import type { EventArgs, EventSubscriber } from "@mikro-orm/core";

import { stampFields } from "#core/functions/stamp-fields.function";

/**
 * Stamps unit-of-work writes.
 *
 * @example
 * const database = await PostgresDatabaseDriver.connect({ url, subscribers: [new StampSubscriber()] });
 */
export class StampSubscriber implements EventSubscriber<object> {
  /** The ORM's `beforeCreate`: stamps who created the row, keeping a value already set (a seed or an import). */
  beforeCreate(args: EventArgs<object>): void {
    const entity = args.entity as Record<string, unknown>;
    for (const [field, value] of Object.entries(stampFields(args.meta.class, "create")))
      if (entity[field] === null || entity[field] === undefined) entity[field] = value;
  }

  /** The ORM's `beforeUpdate`: stamps when and by whom the row last changed. */
  beforeUpdate(args: EventArgs<object>): void {
    Object.assign(args.entity, stampFields(args.meta.class, "update"));
  }
}
