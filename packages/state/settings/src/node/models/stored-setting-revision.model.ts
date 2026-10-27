/**
 * Stackra file contract:
 * Purpose: `StoredSettingRevision`, one recorded settings change of one holder: the values it sets, the paths it
 *          removes and locks, the values it replaced, who made and decided it, where it lands, when it takes effect
 *          and its status.
 * Boundary: data only. Key `settings.stored_setting_revision`, table `settings.stored_setting_revisions`. A node
 *           revision carries `scopeId` and `scopePath`, a user revision `userId`; a root revision carries neither.
 *           Rows are written through `StoredSettingRevisionService`, never with `new`. Values are configuration, never
 *           a secret.
 * Runtime: node
 * Governing contract: ADR 0213 (decision 5); ADR 0359 (decisions 4 and 9); ADR 0327 (decisions 3 and 9); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { Field } from "@stackra/validation";

import type { SettingEnvironment, SettingRevisionStatus, SettingValue } from "#contracts/index";
import { SETTING_VALUES_SCHEMA } from "#node/constants/setting-values-schema.constant";

/** One revision. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class StoredSettingRevision extends Model.with(HasPublicId("ssr"), Timestamps) {
  /** The values it sets, by path in the group. */
  // reason: SettingValue is a union of scalars, which no shape type states
  @Field(SETTING_VALUES_SCHEMA)
  values!: Readonly<Record<string, SettingValue>>;

  /** The resolved values of the changed paths before it. */
  // reason: SettingValue is a union of scalars, which no shape type states
  @Field(SETTING_VALUES_SCHEMA)
  previous!: Readonly<Record<string, SettingValue>>;

  /** The group key (`orders`). */
  groupKey!: string;

  /** The node of a node revision; `null` otherwise. */
  scopeId!: PublicId<"scp"> | null;

  /** That node's `ltree` path; `null` otherwise. */
  scopePath!: string | null;

  /** The user of a user revision; `null` otherwise. */
  userId!: PublicId<"usr"> | null;

  /** The paths it removes. */
  removed!: readonly string[];

  /** The written paths it locks; `null` keeps each written path's lock. */
  locked!: readonly string[] | null;

  /** Who made it. */
  author!: string;

  /** Why; `null` when no reason was given. */
  reason!: string | null;

  /** Where it lands. */
  environment!: SettingEnvironment;

  /** Whether it changed live configuration outside promotion. */
  breakGlass!: boolean;

  /** Where the revision stands. */
  status!: SettingRevisionStatus;

  /** When it takes effect. */
  effectiveAt!: Date;

  /** Who approved or rejected it; `null` until then. */
  decidedBy!: string | null;

  /** When it applied; `null` until then. */
  appliedAt!: Date | null;
}

/** Lets an insert of `StoredSettingRevision` leave out the trait timestamps. */
// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the trait timestamps
// out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface StoredSettingRevision {
  /** The trait timestamps an insert may leave out. */
  [OptionalProps]?: "createdAt" | "updatedAt";
}
