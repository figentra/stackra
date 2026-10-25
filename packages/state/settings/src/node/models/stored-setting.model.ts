/**
 * Stackra file contract:
 * Purpose: `StoredSetting`, the stored values of one settings group for one holder: a scope node (its id and its
 *          materialised path) or a user, with the values by path in the group and the paths the holder locks.
 * Boundary: data only. Key `settings.stored_setting`, table `settings.stored_settings`; one row per group and node,
 *           and one per group and user (unique indexes in the migration). A node row carries `scopeId` and
 *           `scopePath`, a user row `userId`; never both. `values` holds what `SettingsReader#write` or a generated
 *           settings operation checked, never a secret. Rows are written through `StoredSettingService.store`, never
 *           with `new`; the ORM loads rows without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0213 (decisions 1 and 2); ADR 0327 (decisions 3 and 9: a consumer's own table keyed by
 *                     `scope_id`); ADR 0294 (decisions 4, 11, 20 and 27); ADR 0135 (public ids).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

import type { SettingValue } from "#contracts/index";

/** One holder's values of one group. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class StoredSetting extends Model.with(HasPublicId("sst"), Timestamps) {
  /** The group key, which is the module key (`orders`). */
  groupKey!: string;

  /** The node of a node row; `null` on a user row. */
  scopeId!: PublicId<"scp"> | null;

  /** That node's `ltree` path, denormalised for the ancestor read; `null` on a user row. */
  scopePath!: string | null;

  /** The user of a user row; `null` on a node row. */
  userId!: PublicId<"usr"> | null;

  /** The holder's values by path in the group. */
  values!: Readonly<Record<string, SettingValue>>;

  /** The paths the holder locks for every holder below it. */
  locked!: readonly string[];
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the trait timestamps
// out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface StoredSetting {
  [OptionalProps]?: "createdAt" | "updatedAt";
}
