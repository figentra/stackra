/**
 * Stackra file contract:
 * Purpose: `CustomField`, one stored custom field definition: the scope node it is defined at, the key of the model it
 *          extends and the runtime subtype within it (`''` for the whole model), and the definition itself (key,
 *          registered type, label per locale, required, the type's bounds and choices in `rules`).
 * Boundary: data and nothing else (ADR 0154). Key `content.custom_field`, table `content.custom_fields`, under forced
 *           row-level security on `scope_path`; unique per scope, model, subtype and key. Rows are added through
 *           `CustomFieldService.define`, never with `new`; the ORM loads rows without running the constructor.
 * Runtime: node
 * Governing contract: ADR 0116 (decision CT2) as amended by ADR 0226; ADR 0327 (decisions 3 and 9: keyed by
 *                     `scope_id`); ADR 0162 (translated label); ADR 0294 (decisions 4, 11, 20 and 27); ADR 0135
 *                     (public ids).
 */
import type { PublicId } from "@stackra/contracts";
import type { OptionalProps } from "@stackra/database";
import { HasPublicId, Model, Timestamps, Translatable, type Translated } from "@stackra/model";

import type { CustomFieldDefinition, CustomFieldType } from "#core/index";

/** A custom field definition. Traits add `id` and the timestamps; the indexes are the migration's. */
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: merged with the [OptionalProps] augmentation below
export class CustomField extends Model.with(
  HasPublicId("cfd"),
  Timestamps,
  Translatable(["label"]),
) {
  /** The scope node the field is defined at. */
  scopeId!: PublicId<"scp">;

  /** That node's `ltree` path, denormalised for row-level security. */
  scopePath!: string;

  /** The key of the model the field extends (`catalogue.product`). */
  model!: string;

  /** The runtime type of the model the field belongs to (a content type key); `''` for the whole model. */
  subtype = "";

  /** The value's camelCase key on a record. */
  key!: string;

  /** The registered type, which fixes the value's shape. */
  type!: CustomFieldType;

  /** The field's label per locale. */
  label!: Translated;

  /** Whether every record must carry a value. */
  required = false;

  /** The type's choices and bounds, as `checkCustomFieldDefinition` accepted them. */
  rules: Pick<CustomFieldDefinition, "choices" | "min" | "max"> = {};
}

// shortcut: the `[OptionalProps]` augmentation is written by hand so `CrudService.insert` may leave the trait timestamps
// out; remove it once gen writes the entity files (STA-339).
// oxlint-disable-next-line typescript/no-unsafe-declaration-merging -- reason: the generated `[OptionalProps]` augmentation merges into the model, as gen's entity files do
export interface CustomField {
  [OptionalProps]?: "createdAt" | "updatedAt";
}
