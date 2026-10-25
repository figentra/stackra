/**
 * Stackra file contract:
 * Purpose: `ModelAddition(Base)`, the kind factory of an edition's typed fields on another product's model:
 *          `class ProductAddition extends ModelAddition(Product) { fit!: Fit; }` in the edition module's
 *          `models/<base>.model-addition.ts`. Gen stores the fields in a side table of the edition's schema, keyed one
 *          to one by the base record's id, and nests them on the wire under the edition module's key.
 * Boundary: a called-only kind base, registered as `model_addition` with its base; it extends `Model`, so field,
 *           relation and index decorators apply as on any model. The base is the released model of the base product's
 *           client package, never its source; this file only records which base it extends. Storage, the wire key,
 *           permissions and the base-version check are gen's (STA-340).
 * Runtime: node
 * Governing contract: ADR 0336 (decisions 1, 2, 3 and 6), as amended by ADR 0350; ADR 0294 (decision 13 as amended
 *                     2026-10-24); ADR 0305 (kind factories take no `define` prefix).
 */
import { kindOf, registerKind } from "@stackra/container";
import type { AnyClass } from "@stackra/container";

import { Model } from "#core/bases/model.base";
import type { ModelClass } from "#core/types/model-class.type";

/**
 * The base of an addition to `base`.
 *
 * @param base - the base product's model.
 * @example
 * export class ProductAddition extends ModelAddition(Product) {
 *   @Str({ max: 32 })
 *   fit!: string;
 * }
 */
export function ModelAddition<B extends Model>(base: AnyClass<B>): ModelClass {
  // reason: the abstract base is extended, never constructed, as in `Model.with`
  const addition = class extends (Model as unknown as ModelClass) {};
  registerKind(addition, "model_addition", { base });
  return addition;
}

/** The base model an addition class extends; undefined for a class that is not an addition. */
ModelAddition.baseOf = (type: AnyClass): AnyClass | undefined => {
  const record = kindOf(type);
  return record?.kind === "model_addition" ? (record.options["base"] as AnyClass) : undefined;
};
