/**
 * Stackra file contract:
 * Purpose: `CustomFieldValueSet`, the custom field values of one record: the record's model key and public id, and its
 *          values keyed by field key, in the side table of ADR 0116 CT2.
 * Boundary: data only. Key `content.custom_field_value_set`, table `content.custom_field_value_sets`, under forced
 *           row-level security on `scope_path`; one row per record (unique model and record id). `values` holds only
 *           what `checkCustomFields` returned; rows are written through `CustomFieldService.write`, never with `new`.
 * Runtime: node
 * Governing contract: ADR 0116 (decision CT2: values in a side table); ADR 0327 (decisions 3 and 9); ADR 0294
 *                     (decisions 4, 11, 20 and 27); ADR 0135 (public ids).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps } from "@stackra/model";
import { Field } from "@stackra/validation";
import { z } from "zod";

import { type CustomFieldValue, CustomFieldValue$ } from "#core/index";

/** The values of one record. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class CustomFieldValueSet extends Model.with(HasPublicId("cfv"), Timestamps) {
  /** The record's values, keyed by field key. */
  // reason: CustomFieldValue is a union this package ships as CustomFieldValue$
  @Field(z.record(z.string(), CustomFieldValue$))
  values!: Readonly<Record<string, CustomFieldValue>>;

  /** The scope node of the record. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The key of the record's model (`catalogue.product`). */
  model!: string;

  /** The record's public id. */
  recordId!: string;
}

/** The insert-optional fields of `CustomFieldValueSet`, merged into the model class (MikroORM `[OptionalProps]`). */
// shortcut: the `[OptionalProps]` augmentation is written by hand so `Repository.create` may leave the trait timestamps
// out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface CustomFieldValueSet {
  /** The fields an insert may leave out: minted ids, trait-filled columns and defaulted fields. */
  [OptionalProps]?: "createdAt" | "updatedAt";
}
