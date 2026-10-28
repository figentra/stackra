/**
 * Stackra file contract:
 * Purpose: `MetadataSubscriber`, the ORM subscriber that refuses the flush of a created or changed row of a
 *          `HasMetadata` model whose `metadata` is not a bag of string values of at most 16 KB.
 * Boundary: passed as one of `DatabaseOptions.subscribers` (the generated boot adds it when a model has the trait).
 *           Native statements fire no entity event; `CrudService.updateWhere` checks its data itself.
 * Runtime: node
 * Governing contract: ADR 0321 (decision 4); ADR 0096 (decision 4: traits run as ORM subscribers); data-layer gap mo18.
 */
import type { EventArgs, EventSubscriber } from "@mikro-orm/core";

import { checkMetadata } from "#core/functions/check-metadata.function";
import { hasMetadata } from "#core/functions/has-metadata.function";

/**
 * Checks the metadata of rows being written.
 *
 * @example
 * const database = await PostgresDatabaseDriver.connect({ url, subscribers: [new MetadataSubscriber()] });
 */
export class MetadataSubscriber implements EventSubscriber<object> {
  /**
   * The ORM's `beforeCreate`.
   *
   * @throws MetadataInvalidError when the new row's metadata is refused.
   */
  beforeCreate(args: EventArgs<object>): void {
    this.check(args);
  }

  /**
   * The ORM's `beforeUpdate`.
   *
   * @throws MetadataInvalidError when the changed row's metadata is refused.
   */
  beforeUpdate(args: EventArgs<object>): void {
    this.check(args);
  }

  /** Checks the row's metadata when its model has the trait. */
  private check({ entity, meta }: EventArgs<object>): void {
    if (hasMetadata(meta.class))
      checkMetadata(meta.className, (entity as { metadata?: unknown }).metadata);
  }
}
