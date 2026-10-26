/**
 * Stackra file contract:
 * Purpose: `ConditionField`, one field of the cross-service condition-field registry: a model's field another
 *          service's stored conditions may test (an Access deny on `orders.order` testing `record.channelId`), with its
 *          rules type, label and, for an enum, its codes.
 * Boundary: data only. Key `rules.condition_field`, table `rules.condition_fields`, public ids `cfd_…`. A platform row,
 *           not tenant-owned: no scope column and no row-level security. Written only by `ConditionFieldService.sync`,
 *           which replaces one model's rows from the owning service's published `FactSource$` documents; the label is
 *           the owning service's lang key, stored, never translated. Source and field keys are camelCase
 *           (`FIELD_KEY`), the one casing. Rows are added through the service, never with `new`.
 * Runtime: node
 * Governing contract: ADR 0331 (decisions 2, 4 and 11); ADR 0294 (decisions 4, 11, 20 and 27); ADR 0135 (public ids);
 *                     STA-817 and STA-1250 (the cross-service registry, one key casing).
 */
import type { OptionalProps } from "@stackra/database";
import type { I18nKey } from "@stackra/i18n";
import { HasPublicId, Model, Timestamps } from "@stackra/model";

import type { FieldType } from "#contracts/index";

/** A registered field. Traits add `id` and the timestamps; the unique index is the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class ConditionField extends Model.with(HasPublicId("cfd"), Timestamps) {
  /** The model whose conditions test it (`orders.order`), the `Rules` key of its registry. */
  model!: string;

  /** The fact source it belongs to (`record`). */
  source!: string;

  /** The camelCase field key (`channelId`). */
  field!: string;

  /** The rules field type, which fixes the operators a condition may apply. */
  type!: FieldType;

  /** The owning service's lang key of the field's name. */
  label!: I18nKey;

  /** An enum field's codes, each with its lang key; null for any other type. */
  values: Readonly<Record<string, I18nKey>> | null = null;
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the trait timestamps
// out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface ConditionField {
  [OptionalProps]?: "createdAt" | "updatedAt" | "values";
}
